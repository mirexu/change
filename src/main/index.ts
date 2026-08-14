import { app, BrowserWindow, dialog, ipcMain, Notification, shell } from 'electron'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import * as engine from '@main/ffmpeg'
import { ffmpegBin } from '@main/ffmpeg'
import * as tags from '@main/tags'
import type { AudioTags, ConvertOptions, TaskProgressEvent, ConvertTask } from '@shared/types'

let mainWindow: BrowserWindow | null = null

function configPath(): string {
  return join(app.getPath('userData'), 'config.json')
}

function readConfig(): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(configPath(), 'utf8'))
  } catch {
    return {}
  }
}

function writeConfig(patch: Record<string, unknown>): void {
  const cfg = { ...readConfig(), ...patch }
  try {
    writeFileSync(configPath(), JSON.stringify(cfg, null, 2), 'utf8')
  } catch {
    /* ignore */
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'Change 格式转换',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function broadcast(channel: string, payload: unknown): void {
  mainWindow?.webContents.send(channel, payload)
}

/** 全部任务结束时,若窗口不在前台,发系统通知 */
function maybeNotifyCompletion(): void {
  const tasks = engine.listTasks()
  const active = tasks.filter((t) => t.status === 'queued' || t.status === 'running')
  if (active.length > 0) return
  if (mainWindow?.isFocused()) return
  const done = tasks.filter((t) => t.status === 'done').length
  const failed = tasks.filter((t) => t.status === 'error').length
  const en = (readConfig().locale as string) === 'en'
  const title = en ? 'Change - Conversion finished' : 'Change - 转换完成'
  const body = en
    ? (failed > 0 ? `${done} done, ${failed} failed` : `${done} task(s) completed`)
    : (failed > 0 ? `${done} 个完成,${failed} 个失败` : `${done} 个任务全部完成`)
  if (Notification.isSupported()) {
    new Notification({ title, body }).show()
  }
}

function registerIpc(): void {
  engine.setEngineHandlers({
    onProgress: (e: TaskProgressEvent) => broadcast('task:progress', e),
    onTaskDone: (t: ConvertTask) => {
      broadcast('task:done', t)
      maybeNotifyCompletion()
    }
  })

  ipcMain.handle('pickFiles', async (_e, filters?: { name: string; extensions: string[] }[]) => {
    const r = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile', 'multiSelections'],
      filters
    })
    return r.canceled ? [] : r.filePaths
  })

  ipcMain.handle('pickDirectory', async () => {
    const r = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory']
    })
    return r.canceled ? null : r.filePaths[0]
  })

  ipcMain.handle('addTask', (_e, inputPath: string, options: ConvertOptions) =>
    engine.addTask(inputPath, options)
  )

  ipcMain.handle('listTasks', () => engine.listTasks())
  ipcMain.handle('cancelTask', (_e, id: string) => engine.cancelTask(id))
  ipcMain.handle('clearFinished', () => engine.clearFinished())
  ipcMain.handle('retryTask', (_e, id: string) => engine.retryTask(id))
  ipcMain.handle('listEncoders', () => engine.listHardwareEncoders())
  ipcMain.handle('probeMediaInfo', (_e, inputPath: string) => engine.probeMediaInfo(inputPath))
  ipcMain.handle('readAudioTags', (_e, inputPath: string) => tags.readAudioTags(inputPath))
  ipcMain.handle('writeAudioTags', async (_e, inputPath: string, t: AudioTags, coverPath?: string) => {
    try {
      await tags.writeAudioTags(inputPath, t, coverPath)
      return true
    } catch {
      return false
    }
  })
  ipcMain.on('openInFolder', (_e, path: string) => shell.showItemInFolder(path))
  ipcMain.on('openExternal', (_e, url: string) => shell.openExternal(url))
  ipcMain.on('quitApp', () => app.quit())

  ipcMain.handle('getLocale', () => (readConfig().locale as string) || 'zh')
  ipcMain.handle('setLocale', (_e, locale: string) => {
    writeConfig({ locale })
    return true
  })

  ipcMain.handle('ffmpegVersion', () => {
    return new Promise<string>((resolvePromise) => {
      execFile(ffmpegBin, ['-version'], { timeout: 15000 }, (err, stdout) => {
        if (err) resolvePromise(`未检测到 ffmpeg: ${err.message}`)
        else resolvePromise(stdout.split('\n')[0])
      })
    })
  })
}

app.whenReady().then(() => {
  engine.loadTasks()
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
