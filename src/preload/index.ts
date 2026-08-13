import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { Api, ConvertOptions, TaskProgressEvent, ConvertTask } from '@shared/types'

const api: Api = {
  pickFiles: (filters) => ipcRenderer.invoke('pickFiles', filters),
  pickDirectory: () => ipcRenderer.invoke('pickDirectory'),
  addTask: (inputPath: string, options: ConvertOptions) =>
    ipcRenderer.invoke('addTask', inputPath, options),
  listTasks: () => ipcRenderer.invoke('listTasks'),
  cancelTask: (id: string) => ipcRenderer.invoke('cancelTask', id),
  clearFinished: () => ipcRenderer.invoke('clearFinished'),
  openInFolder: (path: string) => ipcRenderer.send('openInFolder', path),
  ffmpegVersion: () => ipcRenderer.invoke('ffmpegVersion'),
  listEncoders: () => ipcRenderer.invoke('listEncoders'),
  getPathForFile: (file) => webUtils.getPathForFile(file as File),
  openExternal: (url: string) => ipcRenderer.send('openExternal', url),
  quitApp: () => ipcRenderer.send('quitApp'),
  getLocale: () => ipcRenderer.invoke('getLocale'),
  setLocale: (locale: string) => ipcRenderer.invoke('setLocale', locale),
  onProgress: (cb: (e: TaskProgressEvent) => void) => {
    const listener = (_e: unknown, payload: TaskProgressEvent): void => cb(payload)
    ipcRenderer.on('task:progress', listener)
    return () => ipcRenderer.removeListener('task:progress', listener)
  },
  onTaskDone: (cb: (t: ConvertTask) => void) => {
    const listener = (_e: unknown, payload: ConvertTask): void => cb(payload)
    ipcRenderer.on('task:done', listener)
    return () => ipcRenderer.removeListener('task:done', listener)
  }
}

contextBridge.exposeInMainWorld('api', api)
