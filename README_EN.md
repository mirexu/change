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

- Audio / video / image format conversion
- Batch task queue + real-time progress
- Video codec selection (H.264 / H.265 / AV1 / VP9, etc.)
- Audio codec selection (AAC / MP3 / Opus / FLAC, etc.)
- Custom bitrate, frame rate and resolution
- Clip / trim segments
- Extract audio tracks
- Smart bitrate: when no bitrate is specified, automatically preserves the source audio bitrate and caps it at the format limit
- Lossless FLAC encoding uses 16-bit by default

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
├── main/          # Main process (window, IPC, FFmpeg engine, task queue)
│   ├── index.ts
│   ├── ffmpeg.ts
│   └── document.ts
├── preload/       # Preload script (contextBridge)
│   └── index.ts
├── renderer/      # Renderer process (Vue 3 UI)
│   └── src/
│       ├── App.vue
│       └── main.ts
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
