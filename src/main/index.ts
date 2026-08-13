import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import * as engine from '@main/ffmpeg'
import { ffmpegBin } from '@main/ffmpeg'
import type { ConvertOptions, TaskProgressEvent, ConvertTask } from '@shared/types'

let mainWindow: BrowserWindow | null = null

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
  ipcMain.on('openInFolder', (_e, path: string) => shell.showItemInFolder(path))

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
