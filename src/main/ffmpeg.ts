import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, parse } from 'node:path'
import { app } from 'electron'
import ffmpegStatic from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'
import type { ConvertOptions, ConvertTask, TaskProgressEvent } from '@shared/types'

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
  ac3: 640
}

/** 无损格式,码率概念不适用,不自动设码率 */
const LOSSLESS_AUDIO = new Set(['flac', 'wav', 'pcm_s16le', 'alac', 'ape'])

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

/** 计算目标音频码率:用户显式指定则优先;否则保留源码率并封顶到格式上限 */
async function resolveAudioBitrate(inputPath: string, options: ConvertOptions): Promise<string | undefined> {
  if (options.audioBitrate) return options.audioBitrate
  const codec = options.audioCodec || ''
  if (codec === 'copy' || LOSSLESS_AUDIO.has(codec) || LOSSLESS_AUDIO.has(options.outputFormat)) {
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
  const task: ConvertTask = {
    id,
    inputPath,
    outputPath: output,
    status: 'queued',
    progress: 0,
    detail: '排队中',
    createdAt: Date.now()
  }
  tasks.set(id, task)
  taskOptions.set(id, options)
  queue.push(id)
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
    }
  }
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
    if (!opts.audioCodec || opts.audioCodec !== 'copy') {
      effective.audioBitrate = await resolveAudioBitrate(task.inputPath, opts)
    }
    await executeConversion(task, effective)
    if (!jobs.has(id)) return
    task.status = 'done'
    task.progress = 100
    task.detail = '完成'
    task.finishedAt = Date.now()
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
    try {
      command = ffmpeg(task.inputPath).output(task.outputPath)
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
      if (durationMatch && !totalDuration) {
        totalDuration = toSeconds(durationMatch[1], durationMatch[2], durationMatch[3])
      }
      const timeMatch = line.match(/time=(\d+):(\d+):(\d+\.\d+)/)
      if (timeMatch && totalDuration > 0) {
        const t = toSeconds(timeMatch[1], timeMatch[2], timeMatch[3])
        const progress = Math.min(99, Math.round((t / totalDuration) * 100))
        if (progress !== task.progress) {
          task.progress = progress
          task.detail = '转换中'
          handlers?.onProgress({ id: task.id, progress, detail: task.detail })
        }
      }
      if (stderrLines.length < 50) stderrLines.push(line)
    })

    if (options.videoCodec) command.videoCodec(options.videoCodec)
    if (options.audioCodec) command.audioCodec(options.audioCodec)
    if (options.audioCodec === 'flac') {
      command.outputOptions('-sample_fmt', 's16')
    }
    if (options.videoBitrate) command.videoBitrate(options.videoBitrate)
    if (options.audioBitrate) command.audioBitrate(options.audioBitrate)
    if (options.fps) command.fps(options.fps)
    if (options.resolution) command.size(options.resolution)
    if (options.startTime !== undefined) command.setStartTime(options.startTime)
    if (options.endTime !== undefined) {
      if (options.startTime !== undefined) {
        command.duration(options.endTime - options.startTime)
      } else {
        command.duration(options.endTime)
      }
    }

    jobs.set(task.id, { process: command, cancelled: false })
    command.run()
  })
}

function toSeconds(h: string, m: string, s: string): number {
  return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseFloat(s)
}
