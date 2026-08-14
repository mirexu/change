# Change

[English](./README_EN.md) | [中文](./README.md)

A multimedia format converter that aims to replace Format Factory. Built on FFmpeg, supporting audio/video/image format conversion, batch queue and real-time progress.

[![GitHub Release](https://img.shields.io/github/v/release/mirexu/change)](https://github.com/mirexu/change/releases/latest)
[![GitHub Downloads](https://img.shields.io/github/downloads/mirexu/change/total)](https://github.com/mirexu/change/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> This project is built by **DeepSeek**.

## Why Change?

In short, this tool delivers:

- 🎯 **Works out of the box** — FFmpeg is bundled inside the installer, no extra setup needed.
- 🚀 **Effortless** — smart bitrate detection, batch task queue, converting has never been easier.
- 🧹 **Clean & pure** — no ads, no bundled bloat, it just does one thing: convert.

## 📦 Download

👉 [Download the latest release](https://github.com/mirexu/change/releases/latest)

Supports Windows, macOS and Linux.

## 📸 Screenshot

![Change main UI](./screenshots/main.png)

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop framework | Electron 31 |
| Build | electron-vite + Vite 5 |
| Frontend | Vue 3 + TypeScript + Element Plus |
| Conversion engine | FFmpeg 6.x (`ffmpeg-static` + `fluent-ffmpeg`) |
| Packaging | electron-builder |

## Features

**Conversion**
- Audio / video / image conversion (50+ formats: mp4 / mkv / mov / avi / webm / flv / mp3 / flac / wav / avif / apng / ico, etc.)
- Batch queue + real-time progress + **persistent task history** (survives restart, retry failed tasks)
- Smart bitrate: preserves source audio bitrate and caps it at the format limit when unspecified
- Lossless FLAC uses 16-bit by default, auto-handles ICO / AVIF / APNG special formats

**Hardware Acceleration (experimental)**
- NVIDIA NVENC / AMD AMF / Intel QSV encoding for much faster conversion with lower CPU usage
- ⚠️ Experimental: some GPUs / drivers may have compatibility issues or quality differences

**Video**
- Merge multiple videos into one
- Compress to a target size (MB)
- Extract a frame as an image
- Trim segments, custom frame rate / resolution / bitrate

**Audio**
- Extract audio tracks, convert between audio formats
- Tag editor: title / artist / album / year / comment / lyrics / cover art (stream copy, no re-encode)

**More**
- Chinese / English (switch in Help menu, remembered)
- Drag & drop, media info preview, completion system notification

## Development

```bash
# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Type check
npm run typecheck

# Build
npm run build
```

> The first `npm install` downloads the FFmpeg binary. See "Manual FFmpeg binary setup" below if your network blocks it.

## Packaging

### Local Windows build

```bash
npm run dist
```

### Cross-platform build (CI)

Push a `v*` tag or manually trigger `.github/workflows/build.yml`. GitHub Actions builds Windows / macOS / Linux in parallel and creates a draft release.

## Project Structure

```
src/
├── main/          # Main process (window, IPC, FFmpeg engine, task queue, tags)
│   ├── index.ts
│   ├── ffmpeg.ts
│   ├── tags.ts
│   └── document.ts
├── preload/       # Preload script (contextBridge)
│   └── index.ts
├── renderer/      # Renderer process (Vue 3 UI)
│   └── src/
│       ├── App.vue
│       ├── main.ts
│       ├── i18n.ts
│       └── presets.ts
└── shared/        # Shared types between main and renderer
    └── types.ts
```

## Manual FFmpeg binary setup

If the FFmpeg binary fails to download during `npm install` (GitHub blocked), download and place it manually:

- Download: `https://registry.npmmirror.com/-/binary/ffmpeg-static/b6.1.1/ffmpeg-win32-x64.gz`
- Extract and rename to `ffmpeg.exe`, place it at `node_modules/ffmpeg-static/ffmpeg.exe`

The same applies to the Electron runtime, available at `https://npmmirror.com/mirrors/electron/`.

## Community

- 🐛 Report bugs or request features via [Issues](https://github.com/mirexu/change/issues)
- 💬 Join the discussion in [Discussions](https://github.com/mirexu/change/discussions)

## License

[MIT](./LICENSE)

This project is built by DeepSeek.
