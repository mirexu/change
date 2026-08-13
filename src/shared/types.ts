export type TaskStatus = 'queued' | 'running' | 'done' | 'error' | 'cancelled'

export interface ConvertOptions {
  /** 输出格式,如 mp4/mkv/mp3/av1... */
  outputFormat: string
  /** 视频编码器,如 libx264 / hevc / libaom-av1,缺省自动 */
  videoCodec?: string
  /** 音频编码器 */
  audioCodec?: string
  /** 视频码率,如 2000k */
  videoBitrate?: string
  /** 音频码率,如 192k */
  audioBitrate?: string
  /** 输出尺寸,如 1920x1080,缺省保持原尺寸 */
  resolution?: string
  /** 视频帧率 */
  fps?: number
  /** 裁剪/截取起点(秒) */
  startTime?: number
  /** 裁剪/截取结束点(秒) */
  endTime?: number
  /** 输出目录,缺省为源文件目录 */
  outputDir?: string
  /** 合并模式:与首个输入合并的其它文件路径 */
  mergeInputs?: string[]
  /** 目标输出大小(字节),自动计算视频码率 */
  targetSize?: number
  /** 截帧时间(秒),提取该时刻画面 */
  frameTime?: number
}

export interface ConvertTask {
  id: string
  inputPath: string
  outputPath: string
  status: TaskStatus
  /** 0-100 */
  progress: number
  /** 当前操作说明,如 "转码中" */
  detail: string
  error?: string
  /** 输入文件大小(字节) */
  inputSize?: number
  /** 输出文件大小(字节) */
  outputSize?: number
  createdAt: number
  finishedAt?: number
}

export interface TaskProgressEvent {
  id: string
  progress: number
  detail: string
}

export interface Preset {
  id: string
  name: string
  description?: string
  options: ConvertOptions
  /** 卡片展示信息 */
  tile?: { title: string; sub: string; icon: string }
}

export interface Api {
  /** 选择文件,返回文件路径列表 */
  pickFiles(filters?: { name: string; extensions: string[] }[]): Promise<string[]>
  /** 选择输出目录 */
  pickDirectory(): Promise<string | null>
  /** 添加转换任务 */
  addTask(inputPath: string, options: ConvertOptions): Promise<ConvertTask>
  /** 获取全部任务 */
  listTasks(): Promise<ConvertTask[]>
  /** 取消任务 */
  cancelTask(id: string): Promise<boolean>
  /** 清除已结束任务 */
  clearFinished(): Promise<void>
  /** 在文件管理器中显示文件 */
  openInFolder(path: string): void
  /** 获取 ffmpeg 版本(验证引擎可用) */
  ffmpegVersion(): Promise<string>
  /** 列出可用的硬件编码器(nvenc/amf/qsv) */
  listEncoders(): Promise<string[]>
  /** 获取拖拽文件的真实路径 */
  getPathForFile(file: unknown): string
  /** 用系统浏览器打开链接 */
  openExternal(url: string): void
  /** 退出应用 */
  quitApp(): void
  /** 读取语言设置 */
  getLocale(): Promise<string>
  /** 保存语言设置 */
  setLocale(locale: string): Promise<boolean>
  onProgress(cb: (e: TaskProgressEvent) => void): () => void
  onTaskDone(cb: (t: ConvertTask) => void): () => void
}
