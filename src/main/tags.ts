import { execFile } from 'node:child_process'
import { renameSync, unlinkSync } from 'node:fs'
import { parse, join, extname } from 'node:path'
import { ffmpegBin } from './ffmpeg'
import type { AudioTags } from '@shared/types'

function parseMetadata(stderr: string): Record<string, string> {
  const result: Record<string, string> = {}
  const m = stderr.match(/Metadata:[\s\S]*?(?=\n\s*Duration|\n\s*Stream|\n\s*$)/)
  if (!m) return result
  for (const line of m[0].split('\n')) {
    const kv = line.match(/^\s*([^:]+?)\s*:\s*(.*)$/)
    if (kv) result[kv[1].toLowerCase().trim()] = kv[2].trim()
  }
  return result
}

/** 读取音频文件的标签(title/artist/album/date/comment) */
export function readAudioTags(inputPath: string): Promise<AudioTags> {
  return new Promise((resolve) => {
    execFile(ffmpegBin, ['-hide_banner', '-i', inputPath], (_err, _stdout, stderr) => {
      const meta = parseMetadata(stderr)
      resolve({
        title: meta['title'],
        artist: meta['artist'],
        album: meta['album'],
        date: meta['date'],
        comment: meta['comment']
      })
    })
  })
}

/** 写入音频标签,流复制不重编码,原地替换 */
export function writeAudioTags(inputPath: string, tags: AudioTags, coverPath?: string): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const { dir, name, ext } = parse(inputPath)
    const tmp = join(dir, `${name}.tagged${ext}`)
    const extLower = extname(inputPath).toLowerCase()

    const args = ['-hide_banner', '-i', inputPath]
    if (coverPath) args.push('-i', coverPath)
    if (coverPath) {
      args.push('-map', '0:a:0', '-map', '1:v:0')
    } else {
      args.push('-map', '0')
    }
    args.push('-c', 'copy')

    if (coverPath) {
      if (extLower === '.mp3') {
        args.push('-id3v2_version', '3')
        args.push('-metadata:s:v', 'title=Album cover', '-metadata:s:v', 'comment=Cover (front)')
      } else {
        args.push('-disposition:v:0', 'attached_pic')
      }
    }

    if (tags.title) args.push('-metadata', `title=${tags.title}`)
    if (tags.artist) args.push('-metadata', `artist=${tags.artist}`)
    if (tags.album) args.push('-metadata', `album=${tags.album}`)
    if (tags.date) args.push('-metadata', `date=${tags.date}`)
    if (tags.comment) args.push('-metadata', `comment=${tags.comment}`)

    args.push('-y', tmp)

    execFile(ffmpegBin, args, { timeout: 120000 }, (err) => {
      if (err) {
        try {
          unlinkSync(tmp)
        } catch {
          /* ignore */
        }
        rejectPromise(err)
        return
      }
      try {
        unlinkSync(inputPath)
        renameSync(tmp, inputPath)
        resolvePromise()
      } catch (e) {
        rejectPromise(e)
      }
    })
  })
}
