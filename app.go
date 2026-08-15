package main

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sync"

	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App 应用结构,公开方法会自动绑定到前端
type App struct {
	ctx         context.Context
	mu          sync.Mutex
	tasks       map[string]*ConvertTask
	taskOptions map[string]ConvertOptions
	queue       []string
	running     bool
	runningCmd  *exec.Cmd
	runningID   string
}

// NewApp 创建应用实例
func NewApp() *App {
	return &App{
		tasks:       map[string]*ConvertTask{},
		taskOptions: map[string]ConvertOptions{},
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.loadTasks()
}

// ---------- 配置 ----------

func configDir() string {
	dir, err := os.UserConfigDir()
	if err != nil {
		dir = "."
	}
	d := filepath.Join(dir, "Change")
	_ = os.MkdirAll(d, 0o755)
	return d
}

// GetLocale 读取语言设置
func (a *App) GetLocale() string {
	data, err := os.ReadFile(filepath.Join(configDir(), "config.json"))
	if err != nil {
		return "zh"
	}
	var cfg map[string]string
	if json.Unmarshal(data, &cfg) != nil {
		return "zh"
	}
	if cfg["locale"] == "" {
		return "zh"
	}
	return cfg["locale"]
}

// SetLocale 保存语言设置
func (a *App) SetLocale(locale string) bool {
	cfg := map[string]string{}
	if data, err := os.ReadFile(filepath.Join(configDir(), "config.json")); err == nil {
		_ = json.Unmarshal(data, &cfg)
	}
	cfg["locale"] = locale
	out, _ := json.MarshalIndent(cfg, "", "  ")
	return os.WriteFile(filepath.Join(configDir(), "config.json"), out, 0o644) == nil
}

// ---------- 对话框 / 系统 ----------

// PickFiles 打开多选文件对话框
func (a *App) PickFiles(filters []map[string]interface{}) []string {
	var fs []wruntime.FileFilter
	for _, f := range filters {
		name, _ := f["name"].(string)
		exts, _ := f["extensions"].([]interface{})
		var patterns []string
		for _, e := range exts {
			if s, ok := e.(string); ok {
				patterns = append(patterns, "*."+s)
			}
		}
		pattern := ""
		for i, p := range patterns {
			if i > 0 {
				pattern += ";"
			}
			pattern += p
		}
		fs = append(fs, wruntime.FileFilter{DisplayName: name, Pattern: pattern})
	}
	files, err := wruntime.OpenMultipleFilesDialog(a.ctx, wruntime.OpenDialogOptions{
		Title:   "选择文件",
		Filters: fs,
	})
	if err != nil {
		return []string{}
	}
	return files
}

// PickDirectory 打开目录选择对话框
func (a *App) PickDirectory() string {
	dir, err := wruntime.OpenDirectoryDialog(a.ctx, wruntime.OpenDialogOptions{
		Title: "选择输出目录",
	})
	if err != nil {
		return ""
	}
	return dir
}

// OpenExternal 用系统浏览器打开链接
func (a *App) OpenExternal(url string) {
	wruntime.BrowserOpenURL(a.ctx, url)
}

// OpenInFolder 在文件管理器中显示文件
func (a *App) OpenInFolder(path string) {
	switch runtime.GOOS {
	case "windows":
		_ = exec.Command("explorer.exe", "/select,"+path).Start()
	case "darwin":
		_ = exec.Command("open", "-R", path).Start()
	default:
		_ = exec.Command("xdg-open", filepath.Dir(path)).Start()
	}
}

// QuitApp 退出应用
func (a *App) QuitApp() {
	wruntime.Quit(a.ctx)
}

// ---------- 媒体信息 / 标签 ----------

// ProbeMediaInfo 探测媒体信息
func (a *App) ProbeMediaInfo(inputPath string) MediaInfo {
	return probeMediaInfo(inputPath)
}

// ReadAudioTags 读取音频标签
func (a *App) ReadAudioTags(inputPath string) AudioTags {
	return readAudioTags(inputPath)
}

// WriteAudioTags 写入音频标签
func (a *App) WriteAudioTags(inputPath string, tags AudioTags, coverPath string) bool {
	return writeAudioTags(inputPath, tags, coverPath) == nil
}
