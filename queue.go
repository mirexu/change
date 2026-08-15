package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"

	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

func newID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

// ---------- 任务队列 ----------

// AddTask 添加转换任务
func (a *App) AddTask(inputPath string, options ConvertOptions) ConvertTask {
	a.mu.Lock()
	task := &ConvertTask{
		ID:         newID(),
		InputPath:  inputPath,
		OutputPath: buildOutputPath(inputPath, options),
		Status:     "queued",
		Detail:     "排队中",
		CreatedAt:  time.Now().UnixMilli(),
	}
	if st, err := os.Stat(inputPath); err == nil {
		task.InputSize = st.Size()
	}
	a.tasks[task.ID] = task
	a.taskOptions[task.ID] = options
	a.queue = append(a.queue, task.ID)
	a.mu.Unlock()

	a.persistTasks()
	go a.pump()
	return *task
}

// ListTasks 获取全部任务(按创建时间倒序)
func (a *App) ListTasks() []ConvertTask {
	a.mu.Lock()
	defer a.mu.Unlock()
	result := make([]ConvertTask, 0, len(a.tasks))
	for _, t := range a.tasks {
		result = append(result, *t)
	}
	sort.Slice(result, func(i, j int) bool { return result[i].CreatedAt > result[j].CreatedAt })
	return result
}

// CancelTask 取消任务
func (a *App) CancelTask(id string) bool {
	a.mu.Lock()
	task := a.tasks[id]
	if task == nil {
		a.mu.Unlock()
		return false
	}
	// 从队列移除
	for i, qid := range a.queue {
		if qid == id {
			a.queue = append(a.queue[:i], a.queue[i+1:]...)
			break
		}
	}
	if task.Status == "queued" {
		task.Status = "cancelled"
		task.Detail = "已取消"
		task.FinishedAt = time.Now().UnixMilli()
		a.persistTasks()
		a.mu.Unlock()
		a.emitTaskDone(*task)
		return true
	}
	if task.Status == "running" && a.runningCmd != nil && a.runningID == id {
		_ = a.runningCmd.Process.Kill()
	}
	a.mu.Unlock()
	return true
}

// ClearFinished 清除已结束任务
func (a *App) ClearFinished() {
	a.mu.Lock()
	for id, t := range a.tasks {
		if t.Status == "done" || t.Status == "error" || t.Status == "cancelled" {
			delete(a.tasks, id)
			delete(a.taskOptions, id)
		}
	}
	a.mu.Unlock()
	a.persistTasks()
}

// RetryTask 重试失败/已取消的任务
func (a *App) RetryTask(id string) bool {
	a.mu.Lock()
	task := a.tasks[id]
	_, ok := a.taskOptions[id]
	if task == nil || !ok || task.Status == "running" || task.Status == "queued" {
		a.mu.Unlock()
		return false
	}
	task.Status = "queued"
	task.Progress = 0
	task.Detail = "排队中"
	task.Error = ""
	task.OutputSize = 0
	task.FinishedAt = 0
	a.queue = append(a.queue, id)
	a.mu.Unlock()

	a.persistTasks()
	go a.pump()
	return true
}

// pump 队列调度
func (a *App) pump() {
	a.mu.Lock()
	if a.running || len(a.queue) == 0 {
		a.mu.Unlock()
		return
	}
	a.running = true
	id := a.queue[0]
	a.queue = a.queue[1:]
	task := a.tasks[id]
	opts := a.taskOptions[id]
	task.Status = "running"
	task.Detail = "启动中"
	a.mu.Unlock()

	a.emitTaskDone(*task)

	go func() {
		a.runTask(id, task, opts)
		a.mu.Lock()
		a.running = false
		a.runningID = ""
		a.mu.Unlock()
		a.pump()
	}()
}

// runTask 执行单个任务
func (a *App) runTask(id string, task *ConvertTask, opts ConvertOptions) {
	if opts.TargetSize > 0 {
		if d, err := probeDuration(task.InputPath); err == nil && d > 0 {
			targetBits := float64(opts.TargetSize) * 8
			videoBps := targetBits/d - 128000
			if videoBps < 50000 {
				videoBps = 50000
			}
			opts.VideoBitrate = fmt.Sprintf("%dk", int(videoBps/1000))
		}
	}
	if opts.AudioCodec != "copy" {
		opts.AudioBitrate = resolveAudioBitrate(task.InputPath, opts)
	}

	cmd, err := runConversion(task, opts, func(p int, detail string) {
		a.mu.Lock()
		if p != task.Progress {
			task.Progress = p
			task.Detail = detail
		}
		a.mu.Unlock()
		wruntime.EventsEmit(a.ctx, "task:progress", TaskProgressEvent{ID: id, Progress: p, Detail: detail})
	})

	if err != nil {
		a.finishTask(id, task, "error", "转换失败", err.Error())
		return
	}

	a.mu.Lock()
	a.runningCmd = cmd
	a.runningID = id
	a.mu.Unlock()

	waitErr := cmd.Wait()

	a.mu.Lock()
	a.runningCmd = nil
	if task.Status == "cancelled" {
		a.mu.Unlock()
		a.finishTask(id, task, "cancelled", "已取消", "")
		return
	}
	a.mu.Unlock()

	if waitErr != nil {
		a.finishTask(id, task, "error", "转换失败", waitErr.Error())
		return
	}
	a.finishTask(id, task, "done", "完成", "")
}

func (a *App) finishTask(id string, task *ConvertTask, status, detail, errMsg string) {
	a.mu.Lock()
	task.Status = status
	task.Detail = detail
	task.Error = errMsg
	task.FinishedAt = time.Now().UnixMilli()
	if status == "done" {
		task.Progress = 100
		if st, e := os.Stat(task.OutputPath); e == nil {
			task.OutputSize = st.Size()
		}
	}
	a.mu.Unlock()
	a.persistTasks()
	a.emitTaskDone(*task)
}

func (a *App) emitTaskDone(task ConvertTask) {
	wruntime.EventsEmit(a.ctx, "task:done", task)
}

// ---------- 持久化 ----------

func tasksFilePath() string {
	return filepath.Join(configDir(), "tasks.json")
}

func (a *App) persistTasks() {
	a.mu.Lock()
	data := map[string]interface{}{
		"tasks":   a.listTasksUnsafe(),
		"options": a.taskOptions,
	}
	a.mu.Unlock()
	out, _ := json.MarshalIndent(data, "", "  ")
	_ = os.WriteFile(tasksFilePath(), out, 0o644)
}

func (a *App) listTasksUnsafe() []ConvertTask {
	result := make([]ConvertTask, 0, len(a.tasks))
	for _, t := range a.tasks {
		result = append(result, *t)
	}
	return result
}

// loadTasks 启动时恢复任务历史
func (a *App) loadTasks() {
	data, err := os.ReadFile(tasksFilePath())
	if err != nil {
		return
	}
	var parsed struct {
		Tasks   []ConvertTask             `json:"tasks"`
		Options map[string]ConvertOptions `json:"options"`
	}
	if json.Unmarshal(data, &parsed) != nil {
		return
	}
	a.mu.Lock()
	for _, t := range parsed.Tasks {
		if t.Status == "queued" || t.Status == "running" {
			t.Status = "cancelled"
			t.Detail = "已中断"
		}
		tc := t
		a.tasks[tc.ID] = &tc
	}
	for id, o := range parsed.Options {
		if a.tasks[id] != nil {
			a.taskOptions[id] = o
		}
	}
	a.mu.Unlock()
}
