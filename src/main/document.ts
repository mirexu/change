import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app } from 'electron'

const VENDOR = join(app.getAppPath(), 'vendor')
const SYSTEM_PATHS = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
]

export function resolveSoffice(): string | null {
  if (process.env.SOFFICE_BIN && existsSync(process.env.SOFFICE_BIN)) {
    return process.env.SOFFICE_BIN
  }
  const vendor = join(VENDOR, 'LibreOffice', 'program', 'soffice.exe')
  if (existsSync(vendor)) return vendor
  for (const p of SYSTEM_PATHS) {
    if (existsSync(p)) return p
  }
  return null
}

export function isDocumentPath(inputPath: string): boolean {
  const ext = inputPath.split('.').pop()?.toLowerCase() || ''
  return DOCUMENT_EXTS.includes(ext)
}

export function isDocumentFormat(format: string): boolean {
  return DOCUMENT_FORMATS.includes(format.toLowerCase())
}

export const DOCUMENT_EXTS = [
  'pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'odt', 'ods', 'odp',
  'rtf', 'txt', 'csv', 'html', 'htm', 'epub', 'md', 'mobi'
]

export const DOCUMENT_FORMATS = [
  'pdf', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'txt', 'csv', 'rtf', 'epub'
]

export function executeDocumentConversion(
  inputPath: string,
  outputPath: string,
  outputFormat: string
): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const soffice = resolveSoffice()
    if (!soffice) {
      rejectPromise(new Error('未找到 LibreOffice。请安装 LibreOffice 或放到 vendor/LibreOffice 目录'))
      return
    }
    const outDir = dirname(outputPath)
    const args = [
      '--headless', '--norestore', '--invisible',
      '--convert-to', outputFormat.toLowerCase(),
      '--outdir', outDir,
      inputPath
    ]
    const child = spawn(soffice, args, { windowsHide: true })
    let stderr = ''
    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString()
    })
    child.on('error', (err) => rejectPromise(err))
    child.on('close', (code) => {
      if (code === 0) resolvePromise()
      else rejectPromise(new Error(`LibreOffice 转换失败 (code ${code}): ${stderr.trim()}`))
    })
  })
}
