import { ref } from 'vue'

export type Locale = 'zh' | 'en'

export const locale = ref<Locale>('zh')

const zh = {
  'brand': 'Change 格式转换',

  'menu.file': '文件',
  'menu.addFiles': '添加文件',
  'menu.pickOutDir': '选择输出目录',
  'menu.quit': '退出',
  'menu.help': '帮助',
  'menu.about': '关于 Change',
  'menu.github': 'GitHub 仓库',
  'menu.ffmpegVersion': 'FFmpeg 版本',
  'menu.hardware': '硬件加速',
  'menu.noEncoder': '未检测到硬件编码器',
  'menu.autoEncoder': '自动(软件编码)',
  'menu.language': '语言 / Language',
  'lang.zh': '中文',
  'lang.en': 'English',

  'status.ready': 'FFmpeg 就绪',
  'status.checking': '检测 FFmpeg...',
  'status.unavailable': 'FFmpeg 不可用',

  'mode.convert': '格式转换',
  'mode.merge': '视频合并',
  'mode.frame': '视频截帧',

  'convert.title': '选择输出格式',
  'tab.video': '视频',
  'tab.audio': '音频',
  'tab.image': '图片',

  'files.title': '添加文件',
  'files.dropText': '拖拽文件到这里,或点击选择',
  'files.dropHint': '支持视频 / 音频 / 图片,可多选',

  'adv.title': '高级选项',
  'adv.outputFormat': '输出格式',
  'adv.outputDir': '输出目录',
  'adv.outputDirPlaceholder': '留空则输出到源文件目录',
  'adv.select': '选择',
  'adv.videoCodec': '视频编码器',
  'adv.auto': '自动',
  'adv.copy': '保持原编码',
  'adv.videoBitrate': '视频码率(如 2000k)',
  'adv.audioCodec': '音频编码器',
  'adv.audioBitrate': '留空自动保留源码率',
  'adv.resolution': '画面',
  'adv.resolutionPlaceholder': '尺寸(如 1920x1080)',
  'adv.fpsPlaceholder': '帧率(如 30)',
  'adv.targetSize': '压缩到',
  'adv.targetSizePlaceholder': '目标大小(MB),留空不压缩',
  'adv.targetSizeHint': '自动计算视频码率,尽量压到指定体积',
  'adv.trim': '裁剪/截取',
  'adv.startPlaceholder': '起点(秒)',
  'adv.to': '至',
  'adv.endPlaceholder': '终点(秒)',
  'adv.trimHint': '按起止时间截取片段',
  'convert.start': '开始转换',
  'convert.clear': '清空',

  'merge.title': '视频合并 · 多个视频合成为一个文件',
  'merge.dropText': '拖拽多个视频到这里,或点击选择(按添加顺序合并)',
  'merge.dropHint': '建议使用分辨率/帧率一致的视频',
  'merge.outputFormat': '输出格式',
  'merge.start': '开始合并',

  'frame.title': '视频截帧 · 提取某一帧保存为图片',
  'frame.dropText': '拖入一个视频,或点击选择',
  'frame.time': '截取时间',
  'frame.timePlaceholder': '秒(如 5 或 00:00:05)',
  'frame.timeHint': '留空则截取首帧',
  'frame.format': '图片格式',
  'frame.start': '截取画面',

  'queue.title': '任务队列',
  'queue.clearFinished': '清除已完成',
  'queue.empty': '暂无任务,拖入文件开始转换',
  'queue.file': '文件',
  'queue.progress': '进度',
  'queue.size': '大小',
  'queue.status': '状态',
  'queue.action': '操作',
  'queue.cancel': '取消',
  'queue.open': '打开',

  'st.queued': '排队中',
  'st.running': '转换中',
  'st.done': '完成',
  'st.error': '失败',
  'st.cancelled': '已取消',

  'msg.taskAdded': '任务已加入队列',
  'msg.mergeAdded': '合并任务已加入队列',
  'msg.frameAdded': '截帧任务已加入队列',
  'msg.autoEncoder': '已切换为自动(软件编码),并保存为默认',
  'msg.hwDefault': '已设为默认:',
  'msg.langSaved': '语言已切换为中文',
  'msg.langSavedEn': 'Language switched to English',

  'about.content': '多媒体格式转换工具,替代格式工厂。\n基于 FFmpeg 构建,本项目由 DeepSeek 构建。',
  'about.ok': '知道了',
  'ffmpeg.ok': '确定'
}

const en: typeof zh = {
  'brand': 'Change Media Converter',

  'menu.file': 'File',
  'menu.addFiles': 'Add Files',
  'menu.pickOutDir': 'Choose Output Folder',
  'menu.quit': 'Quit',
  'menu.help': 'Help',
  'menu.about': 'About Change',
  'menu.github': 'GitHub Repository',
  'menu.ffmpegVersion': 'FFmpeg Version',
  'menu.hardware': 'Hardware',
  'menu.noEncoder': 'No hardware encoder detected',
  'menu.autoEncoder': 'Auto (Software)',
  'menu.language': '语言 / Language',
  'lang.zh': '中文',
  'lang.en': 'English',

  'status.ready': 'FFmpeg Ready',
  'status.checking': 'Checking FFmpeg...',
  'status.unavailable': 'FFmpeg Unavailable',

  'mode.convert': 'Convert',
  'mode.merge': 'Merge',
  'mode.frame': 'Extract Frame',

  'convert.title': 'Choose Output Format',
  'tab.video': 'Video',
  'tab.audio': 'Audio',
  'tab.image': 'Image',

  'files.title': 'Add Files',
  'files.dropText': 'Drop files here or click to browse',
  'files.dropHint': 'Supports video / audio / image, multi-select',

  'adv.title': 'Advanced Options',
  'adv.outputFormat': 'Output Format',
  'adv.outputDir': 'Output Folder',
  'adv.outputDirPlaceholder': 'Leave empty to output to source folder',
  'adv.select': 'Browse',
  'adv.videoCodec': 'Video Encoder',
  'adv.auto': 'Auto',
  'adv.copy': 'Copy (original)',
  'adv.videoBitrate': 'Video bitrate (e.g. 2000k)',
  'adv.audioCodec': 'Audio Encoder',
  'adv.audioBitrate': 'Empty keeps source bitrate',
  'adv.resolution': 'Picture',
  'adv.resolutionPlaceholder': 'Size (e.g. 1920x1080)',
  'adv.fpsPlaceholder': 'FPS (e.g. 30)',
  'adv.targetSize': 'Compress to',
  'adv.targetSizePlaceholder': 'Target size (MB), empty = off',
  'adv.targetSizeHint': 'Auto-calculate bitrate to fit target size',
  'adv.trim': 'Trim',
  'adv.startPlaceholder': 'Start (s)',
  'adv.to': 'to',
  'adv.endPlaceholder': 'End (s)',
  'adv.trimHint': 'Trim a segment by time',
  'convert.start': 'Convert',
  'convert.clear': 'Clear',

  'merge.title': 'Merge Videos · combine multiple into one',
  'merge.dropText': 'Drop multiple videos or click to browse (merged in order)',
  'merge.dropHint': 'Use videos with the same resolution & fps',
  'merge.outputFormat': 'Output Format',
  'merge.start': 'Merge',

  'frame.title': 'Extract Frame · save a frame as image',
  'frame.dropText': 'Drop a video or click to browse',
  'frame.time': 'Time',
  'frame.timePlaceholder': 'Seconds (e.g. 5 or 00:00:05)',
  'frame.timeHint': 'Empty = first frame',
  'frame.format': 'Image Format',
  'frame.start': 'Extract',

  'queue.title': 'Task Queue',
  'queue.clearFinished': 'Clear Finished',
  'queue.empty': 'No tasks, drop files to start',
  'queue.file': 'File',
  'queue.progress': 'Progress',
  'queue.size': 'Size',
  'queue.status': 'Status',
  'queue.action': 'Action',
  'queue.cancel': 'Cancel',
  'queue.open': 'Open',

  'st.queued': 'Queued',
  'st.running': 'Converting',
  'st.done': 'Done',
  'st.error': 'Failed',
  'st.cancelled': 'Cancelled',

  'msg.taskAdded': 'Task added to queue',
  'msg.mergeAdded': 'Merge task added to queue',
  'msg.frameAdded': 'Extract task added to queue',
  'msg.autoEncoder': 'Switched to auto (software), saved as default',
  'msg.hwDefault': 'Set as default: ',
  'msg.langSaved': '语言已切换为中文',
  'msg.langSavedEn': 'Language switched to English',

  'about.content': 'A multimedia format converter that replaces Format Factory.\nBuilt on FFmpeg, this project is created by DeepSeek.',
  'about.ok': 'OK',
  'ffmpeg.ok': 'OK'
}

const messages: Record<Locale, typeof zh> = { zh, en }

export function t(key: string): string {
  return messages[locale.value][key] ?? messages.zh[key] ?? key
}

export function setLocale(l: Locale): void {
  locale.value = l
}

/** 格式卡片副标题的英文翻译(中文 → 英文) */
export const tileSubEn: Record<string, string> = {
  '无损': 'Lossless',
  '动图': 'Animated',
  '视频网站': 'Web upload',
  '手机兼容': 'Phone',
  '新一代': 'New-gen',
  '低码率优': 'Efficient',
  '无压缩': 'Uncompressed',
  '蓝光': 'Blu-ray',
  '手机': 'Phone',
  '杜比': 'Dolby',
  '杜比+': 'Dolby+',
  '环绕声': 'Surround',
  '通话': 'Voice',
  '语音': 'Speech',
  '有损': 'Lossy',
  '现代': 'Modern',
  '位图': 'Bitmap',
  '图标': 'Icon'
}
