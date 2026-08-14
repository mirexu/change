import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, parse } from 'node:path'
import { app } from 'electron'
import ffmpegStatic from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'
import type { ConvertOptions, ConvertTask, MediaInfo, TaskProgressEvent } from '@shared/types'

/** 打包后 ffmpeg 位于 resources/ffmpeg/,开发时回退到 ffmpeg-static */
function resolveFfmpegPath(): string {
  if (app.isPackaged) {
    const exe = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    const p = join(process.resourcesPath, 'ffmpeg', exe)
    if (existsSync(p)) return p
  }
  return ffmpegStatic || 'ffmpeg'
}

const ffmpegBin = resolveFfmpegPath()

export { ffmpegBin }

ffmpeg.setFfmpegPath(ffmpegBin)

/** 探测可用的硬件编码器(nvenc / amf / qsv) */
export function listHardwareEncoders(): Promise<string[]> {
  return new Promise((resolve) => {
    execFile(ffmpegBin, ['-hide_banner', '-encoders'], { timeout: 15000 }, (_err, stdout) => {
      const out = stdout || ''
      const names = new Set<string>()
      const re = /\b(h264_nvenc|hevc_nvenc|av1_nvenc|h264_amf|hevc_amf|av1_amf|h264_qsv|hevc_qsv|av1_qsv)\b/g
      let m: RegExpExecArray | null
      while ((m = re.exec(out)) !== null) names.add(m[1])
      resolve([...names])
    })
  })
}

export interface EngineHandlers {
  onProgress: (e: TaskProgressEvent) => void
  onTaskDone: (t: ConvertTask) => void
}

interface RunningJob {
  process: ffmpeg.FfmpegCommand
  cancelled: boolean
}

const tasks = new Map<string, ConvertTask>()
const taskOptions = new Map<string, ConvertOptions>()
const jobs = new Map<string, RunningJob>()
const queue: string[] = []
let running = false
let handlers: EngineHandlers | null = null

/** 各音频格式/编码器支持的最高码率 (kbps) */
const MAX_AUDIO_BITRATE: Record<string, number> = {
  mp3: 320,
  aac: 512,
  m4a: 512,
  ogg: 500,
  opus: 510,
  ac3: 640,
  eac3: 640,
  mp2: 384,
  wma: 320,
  dts: 1536,
  amr: 12,
  spx: 44
}

/** 无损格式,码率概念不适用,不自动设码率 */
const LOSSLESS_AUDIO = new Set(['flac', 'wav', 'pcm_s16le', 'alac', 'ape', 'aiff', 'au', 'caf'])

/** 固定/受限码率格式,由编码器自行决定,不自动设码率 */
const NO_AUTO_BITRATE = new Set(['dts', 'amr', 'spx'])

/** 解析 ffmpeg -i 输出的源音频流码率 (kbps),失败返回 null */
function probeAudioBitrate(inputPath: string): Promise<number | null> {
  return new Promise((resolve) => {
    const bin = ffmpegBin
    execFile(bin, ['-hide_banner', '-i', inputPath], (_err, _stdout, stderr) => {
      const audioLine = stderr.split('\n').find((l) => l.includes('Audio:'))
      const m = audioLine?.match(/Audio:.*?(\d+)\s*kb\/s/)
      resolve(m ? parseInt(m[1], 10) : null)
    })
  })
}

/** 解析 ffmpeg -i 输出的时长 (秒),失败返回 null */
function probeDuration(inputPath: string): Promise<number | null> {
  return new Promise((resolve) => {
    execFile(ffmpegBin, ['-hide_banner', '-i', inputPath], (_err, _stdout, stderr) => {
      const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/)
      resolve(m ? toSeconds(m[1], m[2], m[3]) : null)
    })
  })
}

/** 探测媒体文件信息(时长/分辨率/编码器等) */
export function probeMediaInfo(inputPath: string): Promise<MediaInfo> {
  return new Promise((resolve) => {
    execFile(ffmpegBin, ['-hide_banner', '-i', inputPath], (_err, _stdout, stderr) => {
      const info: MediaInfo = {}
      const dur = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/)
      if (dur) info.duration = toSeconds(dur[1], dur[2], dur[3])
      const vLine = stderr.split('\n').find((l) => l.includes('Video:'))
      if (vLine) {
        const codec = vLine.match(/Video:\s*([^,\s]+)/)
        if (codec) info.videoCodec = codec[1]
        const res = vLine.match(/(\d{2,5})x(\d{2,5})/)
        if (res) {
          info.width = parseInt(res[1], 10)
          info.height = parseInt(res[2], 10)
        }
        const fps = vLine.match(/([\d.]+)\s*fps/)
        if (fps) info.fps = parseFloat(fps[1])
      }
      const aLine = stderr.split('\n').find((l) => l.includes('Audio:'))
      if (aLine) {
        const codec = aLine.match(/Audio:\s*([^,\s]+)/)
        if (codec) info.audioCodec = codec[1]
        const sr = aLine.match(/(\d+)\s*Hz/)
        if (sr) info.audioSampleRate = parseInt(sr[1], 10)
        const ch = aLine.match(/(stereo|mono)/)
        if (ch) info.audioChannels = ch[1] === 'stereo' ? 2 : 1
        const br = aLine.match(/(\d+)\s*kb\/s/)
        if (br) info.audioBitrate = parseInt(br[1], 10)
      }
      resolve(info)
    })
  })
}

/** 计算目标音频码率:用户显式指定则优先;否则保留源码率并封顶到格式上限 */
async function resolveAudioBitrate(inputPath: string, options: ConvertOptions): Promise<string | undefined> {
  if (options.audioBitrate) return options.audioBitrate
  const codec = options.audioCodec || ''
  if (codec === 'copy' || LOSSLESS_AUDIO.has(codec) || LOSSLESS_AUDIO.has(options.outputFormat) || NO_AUTO_BITRATE.has(options.outputFormat)) {
    return undefined
  }
  const sourceBitrate = await probeAudioBitrate(inputPath)
  if (!sourceBitrate) return undefined
  const max = MAX_AUDIO_BITRATE[options.outputFormat] ?? MAX_AUDIO_BITRATE[codec] ?? 512
  const target = Math.max(32, Math.min(sourceBitrate, max))
  return `${target}k`
}

export function setEngineHandlers(h: EngineHandlers): void {
  handlers = h
}

export function listTasks(): ConvertTask[] {
  return [...tasks.values()].sort((a, b) => b.createdAt - a.createdAt)
}

export function addTask(inputPath: string, options: ConvertOptions): ConvertTask {
  const id = randomUUID()
  const output = buildOutputPath(inputPath, options)
  let inputSize: number | undefined
  try {
    inputSize = statSync(inputPath).size
  } catch {
    inputSize = undefined
  }
  const task: ConvertTask = {
    id,
    inputPath,
    outputPath: output,
    status: 'queued',
    progress: 0,
    detail: '排队中',
    inputSize,
    createdAt: Date.now()
  }
  tasks.set(id, task)
  taskOptions.set(id, options)
  queue.push(id)
  persistTasks()
  pump()
  return task
}

export function cancelTask(id: string): boolean {
  const job = jobs.get(id)
  if (job) {
    job.cancelled = true
    job.process.kill('SIGKILL')
    return true
  }
  const i = queue.indexOf(id)
  if (i >= 0) {
    queue.splice(i, 1)
    const task = tasks.get(id)
    if (task) {
      task.status = 'cancelled'
      task.detail = '已取消'
      task.finishedAt = Date.now()
      persistTasks()
      handlers?.onTaskDone(task)
    }
    return true
  }
  return false
}

export function clearFinished(): void {
  for (const [id, t] of tasks) {
    if (t.status === 'done' || t.status === 'error' || t.status === 'cancelled') {
      tasks.delete(id)
      taskOptions.delete(id)
    }
  }
  persistTasks()
}

function tasksFilePath(): string {
  return join(app.getPath('userData'), 'tasks.json')
}

function persistTasks(): void {
  try {
    const data = { tasks: listTasks(), options: Object.fromEntries(taskOptions) }
    writeFileSync(tasksFilePath(), JSON.stringify(data, null, 2), 'utf8')
  } catch {
    /* ignore */
  }
}

/** 启动时恢复任务历史;未完成的任务标记为已中断 */
export function loadTasks(): void {
  try {
    const raw = readFileSync(tasksFilePath(), 'utf8')
    const data = JSON.parse(raw)
    if (Array.isArray(data.tasks)) {
      for (const t of data.tasks as ConvertTask[]) {
        if (t.status === 'queued' || t.status === 'running') {
          t.status = 'cancelled'
          t.detail = '已中断'
        }
        tasks.set(t.id, t)
      }
    }
    if (data.options && typeof data.options === 'object') {
      for (const [id, o] of Object.entries(data.options)) {
        if (tasks.has(id)) taskOptions.set(id, o as ConvertOptions)
      }
    }
  } catch {
    /* ignore */
  }
}

/** 重试失败/已取消的任务 */
export function retryTask(id: string): boolean {
  const task = tasks.get(id)
  if (!task || task.status === 'running' || task.status === 'queued') return false
  const opts = taskOptions.get(id)
  if (!opts) return false
  task.status = 'queued'
  task.progress = 0
  task.detail = '排队中'
  task.error = undefined
  task.outputSize = undefined
  task.finishedAt = undefined
  queue.push(id)
  persistTasks()
  pump()
  return true
}

function buildOutputPath(inputPath: string, options: ConvertOptions): string {
  const dir = options.outputDir || dirname(inputPath)
  const { name } = parse(inputPath)
  return join(dir, `${name}.${options.outputFormat}`)
}

function pump(): void {
  if (running || queue.length === 0) return
  running = true
  const id = queue.shift()!
  const task = tasks.get(id)!
  task.status = 'running'
  task.detail = '启动中'
  handlers?.onTaskDone(task)
  runTask(id, task)
}

async function runTask(id: string, task: ConvertTask): Promise<void> {
  const opts = taskOptions.get(id) || { outputFormat: '' }
  try {
    const effective = { ...opts }
    if (opts.targetSize) {
      const duration = await probeDuration(task.inputPath)
      if (duration && duration > 0) {
        const targetBits = opts.targetSize * 8
        const audioBitrateBps = 128000
        const videoBitrateBps = Math.max(50000, targetBits / duration - audioBitrateBps)
        effective.videoBitrate = `${Math.round(videoBitrateBps / 1000)}k`
      }
    }
    if (!opts.audioCodec || opts.audioCodec !== 'copy') {
      effective.audioBitrate = await resolveAudioBitrate(task.inputPath, opts)
    }
    await executeConversion(task, effective)
    if (!jobs.has(id)) return
    task.status = 'done'
    task.progress = 100
    task.detail = '完成'
    task.finishedAt = Date.now()
    try {
      task.outputSize = statSync(task.outputPath).size
    } catch {
      task.outputSize = undefined
    }
    persistTasks()
    handlers?.onTaskDone(task)
  } catch (err) {
    const job = jobs.get(id)
    if (job?.cancelled) {
      task.status = 'cancelled'
      task.detail = '已取消'
    } else {
      task.status = 'error'
      task.detail = '转换失败'
      task.error = err instanceof Error ? err.message : String(err)
    }
    task.finishedAt = Date.now()
    persistTasks()
    handlers?.onTaskDone(task)
  } finally {
    jobs.delete(id)
    running = false
    pump()
  }
}

function executeConversion(task: ConvertTask, options: ConvertOptions): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    let command: ffmpeg.FfmpegCommand
    const isMerge = !!(options.mergeInputs && options.mergeInputs.length > 0)
    try {
      if (isMerge) {
        command = ffmpeg()
        command.input(task.inputPath)
        for (const p of options.mergeInputs!) command.input(p)
        const total = options.mergeInputs!.length + 1
        const parts: string[] = []
        for (let i = 0; i < total; i++) parts.push(`[${i}:v:0][${i}:a:0]`)
        command.complexFilter(`${parts.join('')}concat=n=${total}:v=1:a=1[v][a]`)
        command.output(task.outputPath)
      } else {
        command = ffmpeg(task.inputPath).output(task.outputPath)
      }
    } catch (err) {
      rejectPromise(err)
      return
    }

    let totalDuration = 0
    let handled = false
    const finish = (cb: () => void): void => {
      if (handled) return
      handled = true
      cb()
    }

    command.on('error', (err) => finish(() => rejectPromise(err)))
    command.on('end', () => finish(() => resolvePromise()))

    const stderrLines: string[] = []
    command.on('stderr', (line) => {
      const durationMatch = line.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/)
      if (durationMatch) {
        totalDuration += toSeconds(durationMatch[1], durationMatch[2], durationMatch[3])
      }
      const timeMatch = line.match(/time=(\d+):(\d+):(\d+\.\d+)/)
      if (timeMatch && totalDuration > 0) {
        const t = toSeconds(timeMatch[1], timeMatch[2], timeMatch[3])
        const progress = Math.min(99, Math.round((t / totalDuration) * 100))
        if (progress !== task.progress) {
          task.progress = progress
          task.detail = options.frameTime !== undefined ? '截帧中' : '转换中'
          handlers?.onProgress({ id: task.id, progress, detail: task.detail })
        }
      }
      if (stderrLines.length < 50) stderrLines.push(line)
    })

    if (options.videoCodec) command.videoCodec(options.videoCodec)
    if (options.videoCodec && /nvenc|amf|qsv/.test(options.videoCodec)) {
      command.outputOptions('-pix_fmt', 'yuv420p')
    }
    if (options.audioCodec) command.audioCodec(options.audioCodec)
    if (options.audioCodec === 'flac') {
      command.outputOptions('-sample_fmt', 's16')
    }
    if (options.audioCodec === 'dca') {
      command.outputOptions('-strict', '-2')
    }
    if (options.audioCodec === 'libopencore_amrnb') {
      command.audioChannels(1)
      command.audioFrequency(8000)
    }

    if (options.frameTime !== undefined) {
      command.seekInput(options.frameTime)
      command.outputOptions('-frames:v', '1')
      command.noAudio()
    } else {
      if (options.videoBitrate) command.videoBitrate(options.videoBitrate)
      if (options.audioBitrate) command.audioBitrate(options.audioBitrate)
      if (options.fps) command.fps(options.fps)
      if (options.outputFormat === 'ico') {
        command.outputOptions('-vf', 'scale=256:256:force_original_aspect_ratio=decrease')
      } else if (options.resolution) {
        command.size(options.resolution)
      }
      if (options.startTime !== undefined) command.setStartTime(options.startTime)
      if (options.endTime !== undefined) {
        if (options.startTime !== undefined) {
          command.duration(options.endTime - options.startTime)
        } else {
          command.duration(options.endTime)
        }
      }
    }

    jobs.set(task.id, { process: command, cancelled: false })
    command.run()
  })
}

function toSeconds(h: string, m: string, s: string): number {
  return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseFloat(s)
}
