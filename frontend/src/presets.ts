import type { ConvertOptions, Preset } from './types'

const base: ConvertOptions = { outputFormat: 'mp4' }

export const staticPresets: Preset[] = [
  // ============ 视频 ============
  {
    id: 'mp4-h264',
    name: 'H.264 MP4',
    options: { ...base, videoCodec: 'libx264', audioCodec: 'aac' },
    tile: { title: 'MP4', sub: 'H.264', icon: 'video' }
  },
  {
    id: 'mp4-hevc',
    name: 'H.265/HEVC MP4',
    options: { ...base, videoCodec: 'libx265', audioCodec: 'aac' },
    tile: { title: 'MP4', sub: 'H.265', icon: 'video' }
  },
  {
    id: 'youtube-1080p',
    name: '视频网站 1080p',
    options: { ...base, videoCodec: 'libx264', audioCodec: 'aac', resolution: '1920x1080', fps: 30, videoBitrate: '5000k' },
    tile: { title: '1080p', sub: '视频网站', icon: 'camera' }
  },
  {
    id: 'phone-720p',
    name: '手机兼容 720p',
    options: { ...base, videoCodec: 'libx264', audioCodec: 'aac', resolution: '1280x720', fps: 30 },
    tile: { title: '720p', sub: '手机兼容', icon: 'phone' }
  },
  {
    id: 'mp4-av1',
    name: 'AV1 MP4',
    options: { ...base, videoCodec: 'libaom-av1', audioCodec: 'aac' },
    tile: { title: 'AV1', sub: '新一代', icon: 'video' }
  },
  {
    id: 'mkv',
    name: 'MKV (Matroska)',
    options: { outputFormat: 'mkv', videoCodec: 'libx264', audioCodec: 'aac' },
    tile: { title: 'MKV', sub: 'H.264', icon: 'video' }
  },
  {
    id: 'mov',
    name: 'MOV (QuickTime)',
    options: { outputFormat: 'mov', videoCodec: 'libx264', audioCodec: 'aac' },
    tile: { title: 'MOV', sub: 'H.264', icon: 'video' }
  },
  {
    id: 'avi',
    name: 'AVI',
    options: { outputFormat: 'avi', videoCodec: 'mpeg4', audioCodec: 'libmp3lame' },
    tile: { title: 'AVI', sub: 'MPEG-4', icon: 'video' }
  },
  {
    id: 'webm',
    name: 'WebM',
    options: { outputFormat: 'webm', videoCodec: 'libvpx-vp9', audioCodec: 'libopus' },
    tile: { title: 'WebM', sub: 'VP9', icon: 'video' }
  },
  {
    id: 'flv',
    name: 'FLV (Flash Video)',
    options: { outputFormat: 'flv', videoCodec: 'libx264', audioCodec: 'aac' },
    tile: { title: 'FLV', sub: 'H.264', icon: 'video' }
  },
  {
    id: 'ts',
    name: 'TS (MPEG-TS)',
    options: { outputFormat: 'ts', videoCodec: 'libx264', audioCodec: 'aac' },
    tile: { title: 'TS', sub: 'H.264', icon: 'video' }
  },
  {
    id: 'm2ts',
    name: 'M2TS (蓝光)',
    options: { outputFormat: 'm2ts', videoCodec: 'libx264', audioCodec: 'aac' },
    tile: { title: 'M2TS', sub: '蓝光', icon: 'video' }
  },
  {
    id: 'mpg',
    name: 'MPG (MPEG-2)',
    options: { outputFormat: 'mpg', videoCodec: 'mpeg2video', audioCodec: 'mp2' },
    tile: { title: 'MPG', sub: 'MPEG-2', icon: 'video' }
  },
  {
    id: 'wmv',
    name: 'WMV (Windows)',
    options: { outputFormat: 'wmv', videoCodec: 'wmv2', audioCodec: 'wmav2' },
    tile: { title: 'WMV', sub: 'Windows', icon: 'video' }
  },
  {
    id: '3gp',
    name: '3GP (手机)',
    options: { outputFormat: '3gp', videoCodec: 'libx264', audioCodec: 'aac' },
    tile: { title: '3GP', sub: '手机', icon: 'phone' }
  },
  {
    id: 'm4v',
    name: 'M4V (MPEG-4)',
    options: { outputFormat: 'm4v', videoCodec: 'mpeg4', audioCodec: 'aac' },
    tile: { title: 'M4V', sub: 'MPEG-4', icon: 'video' }
  },
  {
    id: 'vob',
    name: 'VOB (DVD)',
    options: { outputFormat: 'vob', videoCodec: 'mpeg2video', audioCodec: 'ac3' },
    tile: { title: 'VOB', sub: 'DVD', icon: 'video' }
  },
  {
    id: 'ogv',
    name: 'OGV (Theora)',
    options: { outputFormat: 'ogv', videoCodec: 'libtheora', audioCodec: 'libvorbis' },
    tile: { title: 'OGV', sub: 'Theora', icon: 'video' }
  },
  {
    id: 'f4v',
    name: 'F4V (Flash)',
    options: { outputFormat: 'f4v', videoCodec: 'libx264', audioCodec: 'aac' },
    tile: { title: 'F4V', sub: 'H.264', icon: 'video' }
  },
  {
    id: 'video-gif',
    name: '视频转 GIF',
    options: { outputFormat: 'gif' },
    tile: { title: 'GIF', sub: '动图', icon: 'gif' }
  },

  // ============ 音频 ============
  {
    id: 'audio-mp3-320',
    name: 'MP3 320k',
    options: { outputFormat: 'mp3', audioCodec: 'libmp3lame', audioBitrate: '320k' },
    tile: { title: 'MP3', sub: '320k', icon: 'audio' }
  },
  {
    id: 'audio-mp3-128',
    name: 'MP3 128k',
    options: { outputFormat: 'mp3', audioCodec: 'libmp3lame', audioBitrate: '128k' },
    tile: { title: 'MP3', sub: '128k', icon: 'audio' }
  },
  {
    id: 'audio-aac',
    name: 'AAC / M4A',
    options: { outputFormat: 'm4a', audioCodec: 'aac' },
    tile: { title: 'M4A', sub: 'AAC', icon: 'audio' }
  },
  {
    id: 'audio-flac',
    name: 'FLAC 无损',
    options: { outputFormat: 'flac', audioCodec: 'flac' },
    tile: { title: 'FLAC', sub: '无损', icon: 'audio' }
  },
  {
    id: 'audio-opus',
    name: 'Opus',
    options: { outputFormat: 'opus', audioCodec: 'libopus' },
    tile: { title: 'Opus', sub: '低码率优', icon: 'audio' }
  },
  {
    id: 'audio-wav',
    name: 'WAV 无压缩',
    options: { outputFormat: 'wav' },
    tile: { title: 'WAV', sub: '无压缩', icon: 'audio' }
  },
  {
    id: 'audio-alac',
    name: 'ALAC 无损',
    options: { outputFormat: 'm4a', audioCodec: 'alac' },
    tile: { title: 'ALAC', sub: '无损', icon: 'audio' }
  },
  {
    id: 'audio-ogg',
    name: 'OGG (Vorbis)',
    options: { outputFormat: 'ogg', audioCodec: 'libvorbis' },
    tile: { title: 'OGG', sub: 'Vorbis', icon: 'audio' }
  },
  {
    id: 'audio-ac3',
    name: 'AC3 (杜比)',
    options: { outputFormat: 'ac3', audioCodec: 'ac3' },
    tile: { title: 'AC3', sub: '杜比', icon: 'audio' }
  },
  {
    id: 'audio-eac3',
    name: 'E-AC3 (杜比+)',
    options: { outputFormat: 'eac3', audioCodec: 'eac3' },
    tile: { title: 'E-AC3', sub: '杜比+', icon: 'audio' }
  },
  {
    id: 'audio-mp2',
    name: 'MP2',
    options: { outputFormat: 'mp2', audioCodec: 'mp2' },
    tile: { title: 'MP2', sub: 'MPEG-2', icon: 'audio' }
  },
  {
    id: 'audio-wma',
    name: 'WMA (Windows)',
    options: { outputFormat: 'wma', audioCodec: 'wmav2' },
    tile: { title: 'WMA', sub: 'Windows', icon: 'audio' }
  },
  {
    id: 'audio-aiff',
    name: 'AIFF',
    options: { outputFormat: 'aiff' },
    tile: { title: 'AIFF', sub: '无损', icon: 'audio' }
  },
  {
    id: 'audio-caf',
    name: 'CAF (Apple)',
    options: { outputFormat: 'caf', audioCodec: 'alac' },
    tile: { title: 'CAF', sub: 'Apple', icon: 'audio' }
  },
  {
    id: 'audio-dts',
    name: 'DTS',
    options: { outputFormat: 'dts', audioCodec: 'dca' },
    tile: { title: 'DTS', sub: '环绕声', icon: 'audio' }
  },
  {
    id: 'audio-amr',
    name: 'AMR (通话)',
    options: { outputFormat: 'amr', audioCodec: 'libopencore_amrnb' },
    tile: { title: 'AMR', sub: '通话', icon: 'audio' }
  },
  {
    id: 'audio-speex',
    name: 'Speex (语音)',
    options: { outputFormat: 'spx', audioCodec: 'libspeex' },
    tile: { title: 'Speex', sub: '语音', icon: 'audio' }
  },

  // ============ 图片 ============
  {
    id: 'image-jpg',
    name: 'JPG 图片',
    options: { outputFormat: 'jpg' },
    tile: { title: 'JPG', sub: '有损', icon: 'image' }
  },
  {
    id: 'image-png',
    name: 'PNG 图片',
    options: { outputFormat: 'png' },
    tile: { title: 'PNG', sub: '无损', icon: 'image' }
  },
  {
    id: 'image-webp',
    name: 'WebP 图片',
    options: { outputFormat: 'webp' },
    tile: { title: 'WebP', sub: '现代', icon: 'image' }
  },
  {
    id: 'image-bmp',
    name: 'BMP 位图',
    options: { outputFormat: 'bmp' },
    tile: { title: 'BMP', sub: '位图', icon: 'image' }
  },
  {
    id: 'image-tiff',
    name: 'TIFF 无损',
    options: { outputFormat: 'tiff' },
    tile: { title: 'TIFF', sub: '无损', icon: 'image' }
  },
  {
    id: 'image-ico',
    name: 'ICO 图标',
    options: { outputFormat: 'ico' },
    tile: { title: 'ICO', sub: '图标', icon: 'image' }
  },
  {
    id: 'image-avif',
    name: 'AVIF',
    options: { outputFormat: 'avif' },
    tile: { title: 'AVIF', sub: '新一代', icon: 'image' }
  },
  {
    id: 'image-apng',
    name: 'APNG 动图',
    options: { outputFormat: 'apng' },
    tile: { title: 'APNG', sub: '动图', icon: 'image' }
  },
  {
    id: 'image-gif',
    name: 'GIF 动图',
    options: { outputFormat: 'gif' },
    tile: { title: 'GIF', sub: '动图', icon: 'gif' }
  }
]

const HARDWARE_ENCODER_DEFS: { enc: string; name: string; desc: string; codec: string; short: string }[] = [
  { enc: 'h264_nvenc', name: 'H.264 MP4 (NVIDIA NVENC)', desc: 'NVIDIA 显卡硬件加速', codec: 'h264_nvenc', short: 'H.264' },
  { enc: 'hevc_nvenc', name: 'H.265 MP4 (NVIDIA NVENC)', desc: 'NVIDIA 显卡硬件加速', codec: 'hevc_nvenc', short: 'H.265' },
  { enc: 'av1_nvenc', name: 'AV1 MP4 (NVIDIA NVENC)', desc: 'NVIDIA 40 系显卡', codec: 'av1_nvenc', short: 'AV1' },
  { enc: 'h264_amf', name: 'H.264 MP4 (AMD AMF)', desc: 'AMD 显卡硬件加速', codec: 'h264_amf', short: 'H.264' },
  { enc: 'hevc_amf', name: 'H.265 MP4 (AMD AMF)', desc: 'AMD 显卡硬件加速', codec: 'hevc_amf', short: 'H.265' },
  { enc: 'av1_amf', name: 'AV1 MP4 (AMD AMF)', desc: 'AMD 显卡硬件加速', codec: 'av1_amf', short: 'AV1' },
  { enc: 'h264_qsv', name: 'H.264 MP4 (Intel QSV)', desc: 'Intel 核显硬件加速', codec: 'h264_qsv', short: 'H.264' },
  { enc: 'hevc_qsv', name: 'H.265 MP4 (Intel QSV)', desc: 'Intel 核显硬件加速', codec: 'hevc_qsv', short: 'H.265' },
  { enc: 'av1_qsv', name: 'AV1 MP4 (Intel QSV)', desc: 'Intel 核显硬件加速', codec: 'av1_qsv', short: 'AV1' }
]

export function hardwarePresets(encoders: string[]): Preset[] {
  return HARDWARE_ENCODER_DEFS.filter((d) => encoders.includes(d.enc)).map((d) => ({
    id: d.enc,
    name: d.name,
    description: d.desc,
    options: { outputFormat: 'mp4', videoCodec: d.codec, audioCodec: 'aac' },
    tile: {
      title: d.short,
      sub: d.enc.includes('nvenc') ? 'NVENC' : d.enc.includes('amf') ? 'AMF' : 'QSV',
      icon: 'cpu'
    }
  }))
}
