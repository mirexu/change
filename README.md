# Change

多媒体格式转换工具,旨在替代格式工厂。基于 **Go + Wails** 构建,内存占用仅 ~35MB(相比 Electron 版 123MB 降低 72%)。

> 本项目由 **DeepSeek** 构建。

## 亮点

- 🚀 **超低内存**:Wails + 系统 WebView,实测 ~35MB(Electron 版 ~123MB)
- 🎯 **开箱即用**:FFmpeg 9.0.1 随包捆绑,无需安装任何依赖
- 🧹 **干净纯粹**:无广告、无捆绑,单文件夹分发(change + ffmpeg)

## 功能

**格式转换**
- 视频 / 音频 / 图片格式互转(50+ 格式:mp4 / mkv / mov / avi / webm / flv / mp3 / flac / wav / avif / apng / ico 等)
- 批量任务队列 + 实时进度 + **任务历史持久化**(重开还在,失败可重试)
- 智能码率:未手动指定码率时,自动保留源音频码率并封顶到格式上限
- FLAC 无损转码自动 16-bit,ICO / AVIF / APNG 等特殊格式自动处理

**硬件加速(实验性)**
- NVIDIA NVENC / AMD AMF / Intel QSV 硬件编码,大幅提升转码速度、降低 CPU 占用
- ⚠️ 实验性选项:不同显卡 / 驱动可能存在兼容性问题或画质差异

**视频处理**
- 视频合并(多段合成一个)
- 指定大小压缩(压到目标 MB)
- 视频截帧(提取某一帧保存为图片)
- 裁剪 / 截取片段,帧率 / 分辨率 / 码率自定义

**音频处理**
- 提取音轨、各音频格式互转
- 标签编辑:标题 / 歌手 / 专辑 / 年份 / 注释 / 歌词 / 封面(流复制不重编码)

**其它**
- 中英文多语言(帮助菜单切换,记住选择)
- 文件拖拽、视频信息预览

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Wails v2(Go) |
| 后端 | Go 1.26 |
| 前端 | Vue 3 + TypeScript + Element Plus |
| 转码引擎 | FFmpeg 9.0.1(随包捆绑) |

## 开发

```bash
# 安装 Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# 开发模式(前端热更新)
wails dev

# 构建
wails build
```

> 前端依赖需先在 `frontend/` 目录执行 `npm install`。

## 打包

云端 CI(`.github/workflows/build.yml`)在推送 `v*` 标签时自动构建:

- **Windows**:`wails build -nsis` → exe + NSIS 安装包(捆绑 ffmpeg.exe)
- **Linux**:`wails build -tags webkit2_41` → 二进制(捆绑 ffmpeg)
- **macOS**:`wails build` → .app(捆绑 ffmpeg)

## 目录结构

```
├── main.go          # 入口(窗口、FFmpeg 打包配置)
├── app.go           # App 结构、对话框、配置、媒体信息、标签
├── queue.go         # 任务队列 + 进度事件 + 持久化
├── converter.go     # 转码引擎(转码/合并/截帧/压缩/智能码率)
├── ffmpeg.go        # FFmpeg 路径解析 + 探测 + 硬件编码器检测
├── tags.go          # 音频标签读写
├── types.go         # 共享类型
└── frontend/        # Vue 3 前端
    └── src/
        ├── App.vue
        ├── i18n.ts
        ├── presets.ts
        └── types.ts
```

## License

[MIT](./LICENSE)

本项目由 DeepSeek 构建。
