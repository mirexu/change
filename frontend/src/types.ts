import { main } from '../wailsjs/go/models'

export type ConvertOptions = main.ConvertOptions
export type ConvertTask = main.ConvertTask
export type MediaInfo = main.MediaInfo
export type AudioTags = main.AudioTags
export type TaskStatus = 'queued' | 'running' | 'done' | 'error' | 'cancelled'

export interface Preset {
  id: string
  name: string
  description?: string
  options: ConvertOptions
  tile?: { title: string; sub: string; icon: string }
}
