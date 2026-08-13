import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import * as engine from '@main/ffmpeg'
import { ffmpegBin } from '@main/ffmpeg'
import type { ConvertOptions, TaskProgressEvent, ConvertTask } from '@shared/types'

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

function registerIpc(): void {
  engine.setEngineHandlers({
    onProgress: (e: TaskProgressEvent) => broadcast('task:progress', e),
    onTaskDone: (t: ConvertTask) => broadcast('task:done', t)
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
  ipcMain.handle('listEncoders', () => engine.listHardwareEncoders())
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
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
