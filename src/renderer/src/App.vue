<template>
  <el-container class="app">
    <el-header class="app-header">
      <div class="brand">Change 格式转换</div>
      <div class="engine-status">
        <el-tag :type="engineReady ? 'success' : 'warning'" size="small">
          {{ engineReady ? engineText : '检测 FFmpeg...' }}
        </el-tag>
      </div>
    </el-header>

    <el-main class="app-main">
      <el-card shadow="never" class="panel">
        <template #header>
          <div class="panel-header">
            <span>添加任务</span>
          </div>
        </template>

        <el-form label-width="110px" class="opt-form">
          <el-form-item label="文件">
            <el-input
              v-model="fileInput"
              placeholder="点击选择,支持多选"
              readonly
              @click="pickFiles"
            />
          </el-form-item>

          <el-form-item label="输出格式">
            <el-select v-model="options.outputFormat" style="width: 200px">
              <el-option-group label="视频">
                <el-option v-for="f in videoFormats" :key="f" :label="f" :value="f" />
              </el-option-group>
              <el-option-group label="音频">
                <el-option v-for="f in audioFormats" :key="f" :label="f" :value="f" />
              </el-option-group>
              <el-option-group label="图片">
                <el-option v-for="f in imageFormats" :key="f" :label="f" :value="f" />
              </el-option-group>
            </el-select>
          </el-form-item>

          <el-form-item label="输出目录">
            <el-input v-model="outputDirText" placeholder="留空则输出到源文件目录" readonly>
              <template #append>
                <el-button @click="pickOutDir">选择</el-button>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="视频设置">
            <el-select v-model="options.videoCodec" placeholder="编码器(自动)" clearable style="width: 200px">
              <el-option label="H.264 (libx264)" value="libx264" />
              <el-option label="H.265/HEVC (libx265)" value="libx265" />
              <el-option label="AV1 (libaom-av1)" value="libaom-av1" />
              <el-option label="VP9 (libvpx-vp9)" value="libvpx-vp9" />
              <el-option label="保持原编码" value="copy" />
            </el-select>
            <el-input v-model="options.videoBitrate" placeholder="视频码率(如 2000k)" style="width: 180px; margin-left: 8px" />
          </el-form-item>

          <el-form-item label="音频设置">
            <el-select v-model="options.audioCodec" placeholder="编码器(自动)" clearable style="width: 200px">
              <el-option label="AAC (aac)" value="aac" />
              <el-option label="MP3 (libmp3lame)" value="libmp3lame" />
              <el-option label="Opus (libopus)" value="libopus" />
              <el-option label="FLAC (flac)" value="flac" />
              <el-option label="保持原编码" value="copy" />
            </el-select>
            <el-input v-model="options.audioBitrate" placeholder="留空自动保留源码率" style="width: 200px; margin-left: 8px" />
          </el-form-item>

          <el-form-item label="画面">
            <el-input v-model="options.resolution" placeholder="尺寸(如 1920x1080)" style="width: 200px" />
            <el-input v-model="fpsText" placeholder="帧率(如 30)" style="width: 140px; margin-left: 8px" />
          </el-form-item>

          <el-form-item label="裁剪/截取">
            <el-input v-model="startText" placeholder="起点(秒)" style="width: 120px" />
            <span class="range-sep">至</span>
            <el-input v-model="endText" placeholder="终点(秒)" style="width: 120px" />
            <span class="hint">按起止时间截取片段</span>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :disabled="!hasFiles" @click="addTasks">开始转换</el-button>
            <el-button :disabled="!hasFiles" @click="clearFiles">清空</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never" class="panel">
        <template #header>
          <div class="panel-header">
            <span>任务队列</span>
            <el-button size="small" @click="clearFinished">清除已完成</el-button>
          </div>
        </template>

        <el-table :data="tasks" empty-text="暂无任务" max-height="360">
          <el-table-column label="文件" prop="inputPath" min-width="200" show-overflow-tooltip />
          <el-table-column label="输出" prop="outputPath" min-width="180" show-overflow-tooltip />
          <el-table-column label="进度" width="200">
            <template #default="{ row }">
              <el-progress v-if="row.status === 'running' || row.status === 'queued'" :percentage="row.progress" />
              <el-progress v-else :percentage="row.progress" :status="progressStatus(row.status)" />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'running' || row.status === 'queued'"
                size="small"
                @click="cancel(row.id)"
              >
                取消
              </el-button>
              <el-button
                v-else-if="row.status === 'done'"
                size="small"
                type="primary"
                link
                @click="openFile(row.outputPath)"
              >
                打开
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { ConvertOptions, ConvertTask } from '@shared/types'

const videoFormats = ['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv', 'ts', 'av1', 'gif']
const audioFormats = ['mp3', 'aac', 'wav', 'flac', 'ogg', 'opus', 'm4a', 'ac3']
const imageFormats = ['jpg', 'png', 'webp', 'bmp', 'tiff', 'ico']

const files = ref<string[]>([])
const fileInput = ref('')
const outputDir = ref<string>('')
const outputDirText = ref('')
const tasks = ref<ConvertTask[]>([])
const engineReady = ref(false)
const engineText = ref('FFmpeg 就绪')

const options = reactive<ConvertOptions>({
  outputFormat: 'mp4'
})
const fpsText = ref('')
const startText = ref('')
const endText = ref('')

const hasFiles = computed(() => files.value.length > 0)

const cancelProgress = ref<(() => void) | null>(null)
const cancelDone = ref<(() => void) | null>(null)

async function pickFiles(): Promise<void> {
  const picked = await window.api.pickFiles([
    { name: '多媒体文件', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'ts', 'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'jpg', 'png', 'webp', 'bmp', 'gif'] }
  ])
  if (picked.length) {
    files.value = [...files.value, ...picked]
    fileInput.value = `${files.value.length} 个文件已添加`
  }
}

async function pickOutDir(): Promise<void> {
  const dir = await window.api.pickDirectory()
  if (dir) {
    outputDir.value = dir
    outputDirText.value = dir
  }
}

function clearFiles(): void {
  files.value = []
  fileInput.value = ''
}

async function addTasks(): Promise<void> {
  const opts: ConvertOptions = {
    ...options,
    fps: fpsText.value ? Number(fpsText.value) : undefined,
    startTime: startText.value ? Number(startText.value) : undefined,
    endTime: endText.value ? Number(endText.value) : undefined,
    outputDir: outputDir.value || undefined
  }
  for (const f of files.value) {
    await window.api.addTask(f, opts)
  }
  files.value = []
  fileInput.value = ''
  ElMessage.success('任务已加入队列')
  tasks.value = await window.api.listTasks()
}

async function cancel(id: string): Promise<void> {
  await window.api.cancelTask(id)
}

async function clearFinished(): Promise<void> {
  await window.api.clearFinished()
  tasks.value = await window.api.listTasks()
}

function openFile(path: string): void {
  window.api.openInFolder(path)
}

function statusText(s: ConvertTask['status']): string {
  return { queued: '排队中', running: '转换中', done: '完成', error: '失败', cancelled: '已取消' }[s]
}

function statusTagType(s: ConvertTask['status']): 'info' | 'primary' | 'success' | 'danger' | 'warning' {
  const map: Record<ConvertTask['status'], 'info' | 'primary' | 'success' | 'danger' | 'warning'> = {
    queued: 'info',
    running: 'primary',
    done: 'success',
    error: 'danger',
    cancelled: 'warning'
  }
  return map[s]
}

function progressStatus(s: ConvertTask['status']): 'success' | 'exception' {
  return s === 'error' ? 'exception' : 'success'
}

onMounted(async () => {
  tasks.value = await window.api.listTasks()
  const ver = await window.api.ffmpegVersion()
  if (ver && !ver.startsWith('未检测到')) {
    engineReady.value = true
    engineText.value = ver
  } else {
    engineText.value = ver || 'FFmpeg 不可用'
  }
  cancelProgress.value = window.api.onProgress((e) => {
    const t = tasks.value.find((x) => x.id === e.id)
    if (t) {
      t.progress = e.progress
      t.detail = e.detail
    }
  })
  cancelDone.value = window.api.onTaskDone(async (t) => {
    const idx = tasks.value.findIndex((x) => x.id === t.id)
    if (idx >= 0) tasks.value[idx] = t
    else tasks.value.unshift(t)
  })
})

onBeforeUnmount(() => {
  cancelProgress.value?.()
  cancelDone.value?.()
})
</script>

<style scoped>
.app {
  height: 100vh;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color-light);
}
.brand {
  font-size: 18px;
  font-weight: 600;
}
.app-main {
  background: var(--el-fill-color-light);
}
.panel {
  margin-bottom: 16px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.opt-form :deep(.el-input__inner[readonly]) {
  cursor: pointer;
  color: var(--el-text-color-regular);
}
.range-sep {
  margin: 0 8px;
  color: var(--el-text-color-secondary);
}
.hint {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
