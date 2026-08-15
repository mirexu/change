<template>
  <el-config-provider :locale="elLocale">
  <div class="app">
    <header class="menu-bar">
      <div class="menu-left">
        <el-dropdown trigger="click" @command="onFileMenu">
          <span class="menu-item">{{ t('menu.file') }}</span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="addFiles">
                <el-icon><FolderOpened /></el-icon>{{ t('menu.addFiles') }}
              </el-dropdown-item>
              <el-dropdown-item command="pickOutDir">
                <el-icon><Folder /></el-icon>{{ t('menu.pickOutDir') }}
              </el-dropdown-item>
              <el-dropdown-item command="quit" divided>
                <el-icon><SwitchButton /></el-icon>{{ t('menu.quit') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dropdown trigger="click" @command="onHelpMenu">
          <span class="menu-item">{{ t('menu.help') }}</span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="about">
                <el-icon><QuestionFilled /></el-icon>{{ t('menu.about') }}
              </el-dropdown-item>
              <el-dropdown-item command="github">
                <el-icon><Link /></el-icon>{{ t('menu.github') }}
              </el-dropdown-item>
              <el-dropdown-item command="ffmpeg">
                <el-icon><Cpu /></el-icon>{{ t('menu.ffmpegVersion') }}
              </el-dropdown-item>
              <el-dropdown-item command="lang-zh" divided>
                {{ t('lang.zh') }}<template v-if="locale === 'zh'"> ✓</template>
              </el-dropdown-item>
              <el-dropdown-item command="lang-en">
                {{ t('lang.en') }}<template v-if="locale === 'en'"> ✓</template>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dropdown trigger="click" @command="onHardwareMenu">
          <span class="menu-item" :class="{ 'menu-item-active': hardwareShort }">
            <el-icon style="vertical-align: -2px"><Cpu /></el-icon>{{ t('menu.hardware') }}<template v-if="hardwareShort"> · {{ hardwareShort }}</template>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="!hardwareEncoders.length" disabled>{{ t('menu.noEncoder') }}</el-dropdown-item>
              <el-dropdown-item
                v-for="enc in hardwareEncoders"
                :key="enc"
                :command="enc"
                :class="{ 'is-selected': enc === options.videoCodec }"
              >
                {{ encLabel(enc) }}<template v-if="enc === options.videoCodec"> ✓</template>
              </el-dropdown-item>
              <el-dropdown-item divided command="auto">
                {{ t('menu.autoEncoder') }}<template v-if="!isHardwareSelected"> ✓</template>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div class="brand">{{ t('brand') }}</div>

      <div class="engine-status">
        <el-tag :type="engineReady ? 'success' : 'warning'" size="small" effect="light" round>
          {{ engineReady ? t('status.ready') : t('status.checking') }}
        </el-tag>
      </div>
    </header>

    <main class="content">
      <section class="card mode-switch-card">
        <el-radio-group v-model="mode">
          <el-radio-button value="convert">{{ t('mode.convert') }}</el-radio-button>
          <el-radio-button value="merge">{{ t('mode.merge') }}</el-radio-button>
          <el-radio-button value="frame">{{ t('mode.frame') }}</el-radio-button>
          <el-radio-button value="tag">{{ t('mode.tag') }}</el-radio-button>
        </el-radio-group>
      </section>

      <template v-if="mode === 'convert'">
      <section class="card">
        <div class="section-title">{{ t('convert.title') }}</div>
        <el-tabs v-model="activeTab">
          <el-tab-pane :label="t('tab.video')" name="video">
            <div class="tile-grid">
              <div
                v-for="p in videoPresets"
                :key="p.id"
                class="tile"
                :class="{ active: selectedTileId === p.id }"
                @click="applyTile(p)"
              >
                <el-icon class="tile-icon" :size="26"><component :is="tileIcon(p)" /></el-icon>
                <div class="tile-title">{{ tileTitle(p) }}</div>
                <div class="tile-sub">{{ tileSub(p) }}</div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="t('tab.audio')" name="audio">
            <div class="tile-grid">
              <div
                v-for="p in audioPresets"
                :key="p.id"
                class="tile"
                :class="{ active: selectedTileId === p.id }"
                @click="applyTile(p)"
              >
                <el-icon class="tile-icon" :size="26"><component :is="tileIcon(p)" /></el-icon>
                <div class="tile-title">{{ tileTitle(p) }}</div>
                <div class="tile-sub">{{ tileSub(p) }}</div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="t('tab.image')" name="image">
            <div class="tile-grid">
              <div
                v-for="p in imagePresets"
                :key="p.id"
                class="tile"
                :class="{ active: selectedTileId === p.id }"
                @click="applyTile(p)"
              >
                <el-icon class="tile-icon" :size="26"><component :is="tileIcon(p)" /></el-icon>
                <div class="tile-title">{{ tileTitle(p) }}</div>
                <div class="tile-sub">{{ tileSub(p) }}</div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </section>

      <section class="card">
        <div class="section-title">{{ t('files.title') }}</div>
        <div
          class="drop-zone"
          :class="{ dragging: dragging }"
          @click="pickFiles"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <el-icon :size="34" class="drop-icon"><UploadFilled /></el-icon>
          <div class="drop-text">{{ t('files.dropText') }}</div>
          <div class="drop-hint">{{ t('files.dropHint') }}</div>
        </div>

        <div v-if="files.length" class="file-list">
          <div v-for="(f, i) in files" :key="f" class="file-row">
            <el-icon class="file-row-icon"><Document /></el-icon>
            <div class="file-row-main">
              <div class="file-row-name">{{ basename(f) }}</div>
              <div class="file-row-info">{{ formatMediaInfo(fileInfos[f]) }}</div>
            </div>
            <el-button link type="danger" class="file-row-remove" @click="removeFile(i)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </section>

      <section class="card">
        <el-collapse v-model="advancedOpen">
          <el-collapse-item :title="t('adv.title')" name="adv">
            <el-form label-width="100px" class="opt-form">
              <el-form-item :label="t('adv.outputFormat')">
                <el-select v-model="options.outputFormat" style="width: 160px">
                  <el-option-group :label="t('tab.video')">
                    <el-option v-for="f in videoFormats" :key="f" :label="f" :value="f" />
                  </el-option-group>
                  <el-option-group :label="t('tab.audio')">
                    <el-option v-for="f in audioFormats" :key="f" :label="f" :value="f" />
                  </el-option-group>
                  <el-option-group :label="t('tab.image')">
                    <el-option v-for="f in imageFormats" :key="f" :label="f" :value="f" />
                  </el-option-group>
                </el-select>
              </el-form-item>

              <el-form-item :label="t('adv.outputDir')">
                <el-input v-model="outputDirText" :placeholder="t('adv.outputDirPlaceholder')" readonly>
                  <template #append>
                    <el-button @click="pickOutDir">{{ t('adv.select') }}</el-button>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item :label="t('adv.videoCodec')">
                <el-select v-model="options.videoCodec" :placeholder="t('adv.auto')" clearable style="width: 200px">
                  <el-option label="H.264 (libx264)" value="libx264" />
                  <el-option label="H.265/HEVC (libx265)" value="libx265" />
                  <el-option label="AV1 (libaom-av1)" value="libaom-av1" />
                  <el-option label="VP9 (libvpx-vp9)" value="libvpx-vp9" />
                  <el-option v-for="enc in hardwareEncoders" :key="enc" :label="`${encLabel(enc)}(GPU)`" :value="enc" />
                  <el-option :label="t('adv.copy')" value="copy" />
                </el-select>
                <el-input v-model="options.videoBitrate" :placeholder="t('adv.videoBitrate')" style="width: 180px; margin-left: 8px" />
              </el-form-item>

              <el-form-item :label="t('adv.audioCodec')">
                <el-select v-model="options.audioCodec" :placeholder="t('adv.auto')" clearable style="width: 200px">
                  <el-option label="AAC (aac)" value="aac" />
                  <el-option label="MP3 (libmp3lame)" value="libmp3lame" />
                  <el-option label="Opus (libopus)" value="libopus" />
                  <el-option label="FLAC (flac)" value="flac" />
                  <el-option :label="t('adv.copy')" value="copy" />
                </el-select>
                <el-input v-model="options.audioBitrate" :placeholder="t('adv.audioBitrate')" style="width: 200px; margin-left: 8px" />
              </el-form-item>

              <el-form-item :label="t('adv.resolution')">
                <el-input v-model="options.resolution" :placeholder="t('adv.resolutionPlaceholder')" style="width: 200px" />
                <el-input v-model="fpsText" :placeholder="t('adv.fpsPlaceholder')" style="width: 140px; margin-left: 8px" />
              </el-form-item>

              <el-form-item :label="t('adv.targetSize')">
                <el-input v-model="targetSizeText" :placeholder="t('adv.targetSizePlaceholder')" style="width: 200px" />
                <span class="hint">{{ t('adv.targetSizeHint') }}</span>
              </el-form-item>

              <el-form-item :label="t('adv.trim')">
                <el-input v-model="startText" :placeholder="t('adv.startPlaceholder')" style="width: 120px" />
                <span class="range-sep">{{ t('adv.to') }}</span>
                <el-input v-model="endText" :placeholder="t('adv.endPlaceholder')" style="width: 120px" />
                <span class="hint">{{ t('adv.trimHint') }}</span>
              </el-form-item>
            </el-form>
          </el-collapse-item>
        </el-collapse>

        <div class="actions">
          <el-button type="primary" size="large" :disabled="!hasFiles" @click="addTasks">
            <el-icon style="margin-right: 4px"><VideoPlay /></el-icon>{{ t('convert.start') }}
          </el-button>
          <el-button size="large" :disabled="!hasFiles" @click="clearFiles">
            <el-icon style="margin-right: 4px"><Delete /></el-icon>{{ t('convert.clear') }}
          </el-button>
        </div>
      </section>
      </template>

      <template v-else-if="mode === 'merge'">
      <section class="card">
        <div class="section-title">{{ t('merge.title') }}</div>
        <div
          class="drop-zone"
          :class="{ dragging: mergeDragging }"
          @click="pickMergeFiles"
          @dragover.prevent="mergeDragging = true"
          @dragleave.prevent="mergeDragging = false"
          @drop.prevent="onMergeDrop"
        >
          <el-icon :size="34" class="drop-icon"><UploadFilled /></el-icon>
          <div class="drop-text">{{ t('merge.dropText') }}</div>
          <div class="drop-hint">{{ t('merge.dropHint') }}</div>
        </div>

        <div v-if="mergeFiles.length" class="file-chips">
          <el-tag
            v-for="(f, i) in mergeFiles"
            :key="f"
            closable
            type="info"
            effect="plain"
            @close="removeMergeFile(i)"
          >
            {{ i + 1 }}. {{ basename(f) }}
          </el-tag>
        </div>

        <el-form label-width="90px" class="opt-form" style="margin-top: 14px">
          <el-form-item :label="t('merge.outputFormat')">
            <el-select v-model="mergeFormat" style="width: 160px">
              <el-option label="MP4" value="mp4" />
              <el-option label="MKV" value="mkv" />
              <el-option label="MOV" value="mov" />
            </el-select>
          </el-form-item>
        </el-form>

        <div class="actions">
          <el-button type="primary" size="large" :disabled="mergeFiles.length < 2" @click="doMerge">
            <el-icon style="margin-right: 4px"><VideoPlay /></el-icon>{{ t('merge.start') }}
          </el-button>
        </div>
      </section>
      </template>

      <template v-else-if="mode === 'frame'">
      <section class="card">
        <div class="section-title">{{ t('frame.title') }}</div>
        <div
          class="drop-zone"
          :class="{ dragging: frameDragging }"
          @click="pickFrameFile"
          @dragover.prevent="frameDragging = true"
          @dragleave.prevent="frameDragging = false"
          @drop.prevent="onFrameDrop"
        >
          <el-icon :size="34" class="drop-icon"><UploadFilled /></el-icon>
          <div class="drop-text">{{ t('frame.dropText') }}</div>
        </div>

        <div v-if="frameFile" class="file-chips">
          <el-tag closable type="info" effect="plain" @close="clearFrameFile">
            {{ basename(frameFile) }}
          </el-tag>
        </div>

        <el-form label-width="90px" class="opt-form" style="margin-top: 14px">
          <el-form-item :label="t('frame.time')">
            <el-input v-model="frameTimeText" :placeholder="t('frame.timePlaceholder')" style="width: 200px" />
            <span class="hint">{{ t('frame.timeHint') }}</span>
          </el-form-item>
          <el-form-item :label="t('frame.format')">
            <el-select v-model="frameFormat" style="width: 160px">
              <el-option label="JPG" value="jpg" />
              <el-option label="PNG" value="png" />
              <el-option label="WebP" value="webp" />
            </el-select>
          </el-form-item>
        </el-form>

        <div class="actions">
          <el-button type="primary" size="large" :disabled="!frameFile" @click="doFrame">
            <el-icon style="margin-right: 4px"><Picture /></el-icon>{{ t('frame.start') }}
          </el-button>
        </div>
      </section>
      </template>

      <template v-else>
      <section class="card">
        <div class="section-title">{{ t('tag.title') }}</div>
        <div
          class="drop-zone"
          :class="{ dragging: tagDragging }"
          @click="pickTagFile"
          @dragover.prevent="tagDragging = true"
          @dragleave.prevent="tagDragging = false"
          @drop.prevent="onTagDrop"
        >
          <el-icon :size="34" class="drop-icon"><Headset /></el-icon>
          <div class="drop-text">{{ t('tag.dropText') }}</div>
        </div>

        <div v-if="tagFile" class="file-chips" style="margin-top: 12px">
          <el-tag closable type="info" effect="plain" @close="clearTagFile">
            {{ basename(tagFile) }}
          </el-tag>
        </div>

        <el-form v-if="tagFile" label-width="70px" class="opt-form" style="margin-top: 16px; max-width: 480px">
          <el-form-item :label="t('tag.fieldTitle')">
            <el-input v-model="tagFields.title" placeholder="Title" />
          </el-form-item>
          <el-form-item :label="t('tag.fieldArtist')">
            <el-input v-model="tagFields.artist" placeholder="Artist" />
          </el-form-item>
          <el-form-item :label="t('tag.fieldAlbum')">
            <el-input v-model="tagFields.album" placeholder="Album" />
          </el-form-item>
          <el-form-item :label="t('tag.fieldYear')">
            <el-input v-model="tagFields.date" placeholder="2026" style="width: 160px" />
          </el-form-item>
          <el-form-item :label="t('tag.fieldComment')">
            <el-input v-model="tagFields.comment" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item :label="t('tag.fieldLyrics')">
            <el-input v-model="tagFields.lyrics" type="textarea" :rows="6" placeholder="粘贴歌词到这里(纯文本)" />
          </el-form-item>
          <el-form-item :label="t('tag.cover')">
            <div style="display: flex; align-items: center; gap: 8px">
              <el-button @click="pickCover">{{ t('tag.pickCover') }}</el-button>
              <el-button v-if="tagCover" @click="clearCover">{{ t('tag.removeCover') }}</el-button>
              <span v-if="tagCover" class="hint" style="margin-left: 0">{{ basename(tagCover) }}</span>
            </div>
          </el-form-item>
        </el-form>

        <div class="actions">
          <el-button type="primary" size="large" :disabled="!tagFile" @click="saveTags">
            <el-icon style="margin-right: 4px"><Check /></el-icon>{{ t('tag.save') }}
          </el-button>
        </div>
      </section>
      </template>

      <section class="card">
        <div class="section-title queue-title">
          <span>{{ t('queue.title') }}</span>
          <el-button size="small" text type="primary" @click="clearFinished">{{ t('queue.clearFinished') }}</el-button>
        </div>

        <el-table :data="tasks" :empty-text="t('queue.empty')">
          <el-table-column :label="t('queue.file')" prop="inputPath" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="file-cell">{{ basename(row.inputPath) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('queue.progress')" width="190">
            <template #default="{ row }">
              <el-progress
                v-if="row.status === 'running' || row.status === 'queued'"
                :percentage="row.progress"
                :stroke-width="6"
              />
              <el-progress v-else :percentage="row.progress" :status="progressStatus(row.status)" :stroke-width="6" />
            </template>
          </el-table-column>
          <el-table-column :label="t('queue.size')" width="160">
            <template #default="{ row }">
              <span class="size-cell">
                {{ formatSize(row.inputSize) }}
                <template v-if="row.outputSize"> → {{ formatSize(row.outputSize) }}</template>
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="t('queue.status')" width="90">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small" effect="light">
                {{ statusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('queue.action')" width="120">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'running' || row.status === 'queued'"
                size="small"
                @click="cancel(row.id)"
              >
                {{ t('queue.cancel') }}
              </el-button>
              <el-button
                v-else-if="row.status === 'done'"
                size="small"
                type="primary"
                text
                @click="openFile(row.outputPath)"
              >
                {{ t('queue.open') }}
              </el-button>
              <el-button
                v-else-if="row.status === 'error' || row.status === 'cancelled'"
                size="small"
                type="primary"
                text
                @click="retry(row.id)"
              >
                {{ t('queue.retry') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </main>
  </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { Component } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import {
  VideoPlay,
  VideoCamera,
  MagicStick,
  Headset,
  Microphone,
  Picture,
  Cpu,
  Iphone,
  UploadFilled,
  Delete,
  Folder,
  FolderOpened,
  QuestionFilled,
  SwitchButton,
  Link,
  Document,
  Check
} from '@element-plus/icons-vue'
import type { AudioTags, ConvertOptions, ConvertTask, MediaInfo, Preset } from './types'
import { staticPresets } from './presets'
import { t, locale, setLocale, tileSubEn, type Locale } from './i18n'
import {
  AddTask,
  ListTasks,
  CancelTask,
  ClearFinished,
  RetryTask,
  OpenInFolder,
  OpenExternal,
  QuitApp,
  ListEncoders,
  ProbeMediaInfo,
  ReadAudioTags,
  WriteAudioTags,
  PickFiles,
  PickDirectory,
  FfmpegVersion,
  SetLocale
} from '../wailsjs/go/main/App'
import { EventsOn, EventsOff, OnFileDrop } from '../wailsjs/runtime/runtime'

const api = {
  pickFiles: PickFiles,
  pickDirectory: PickDirectory,
  addTask: AddTask,
  listTasks: ListTasks,
  cancelTask: CancelTask,
  clearFinished: ClearFinished,
  retryTask: RetryTask,
  openInFolder: OpenInFolder,
  openExternal: OpenExternal,
  quitApp: QuitApp,
  listEncoders: ListEncoders,
  probeMediaInfo: ProbeMediaInfo,
  readAudioTags: ReadAudioTags,
  writeAudioTags: WriteAudioTags,
  ffmpegVersion: FfmpegVersion,
  setLocale: SetLocale
}

const GITHUB_URL = 'https://github.com/mirexu/change'
const APP_VERSION = '1.0.0'

const elLocale = computed(() => (locale.value === 'en' ? en : zhCn))

const videoFormats = ['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv', 'ts', 'm2ts', 'mpg', 'wmv', '3gp', 'm4v', 'vob', 'ogv', 'f4v', 'gif']
const audioFormats = ['mp3', 'aac', 'wav', 'flac', 'ogg', 'opus', 'm4a', 'ac3', 'eac3', 'mp2', 'wma', 'aiff', 'caf', 'dts', 'amr', 'spx']
const imageFormats = ['jpg', 'png', 'webp', 'bmp', 'tiff', 'ico', 'avif', 'apng', 'gif', 'jp2', 'jls']

const HARDWARE_ENCODER_LABELS: Record<string, string> = {
  h264_nvenc: 'H.264 NVENC',
  hevc_nvenc: 'H.265 NVENC',
  av1_nvenc: 'AV1 NVENC',
  h264_amf: 'H.264 AMF',
  hevc_amf: 'H.265 AMF',
  av1_amf: 'AV1 AMF',
  h264_qsv: 'H.264 QSV',
  hevc_qsv: 'H.265 QSV',
  av1_qsv: 'AV1 QSV'
}

const VIDEO_PRESET_IDS = new Set([
  'mp4-h264', 'mp4-hevc', 'youtube-1080p', 'phone-720p', 'mp4-av1',
  'mkv', 'mov', 'avi', 'webm', 'flv', 'ts', 'm2ts', 'mpg', 'wmv', '3gp',
  'm4v', 'vob', 'ogv', 'f4v', 'video-gif'
])
const AUDIO_PRESET_IDS = new Set([
  'audio-mp3-320', 'audio-mp3-128', 'audio-aac', 'audio-flac', 'audio-opus', 'audio-wav',
  'audio-alac', 'audio-ogg', 'audio-ac3', 'audio-eac3', 'audio-mp2', 'audio-wma',
  'audio-aiff', 'audio-caf', 'audio-dts', 'audio-amr', 'audio-speex'
])
const IMAGE_PRESET_IDS = new Set([
  'image-jpg', 'image-png', 'image-webp', 'image-bmp', 'image-tiff',
  'image-ico', 'image-avif', 'image-apng', 'image-gif'
])

const ICON_MAP: Record<string, Component> = {
  video: VideoPlay,
  camera: VideoCamera,
  phone: Iphone,
  gif: MagicStick,
  audio: Headset,
  mic: Microphone,
  image: Picture,
  cpu: Cpu
}

const videoPresets = computed(() => staticPresets.filter((p) => VIDEO_PRESET_IDS.has(p.id)))
const audioPresets = computed(() => staticPresets.filter((p) => AUDIO_PRESET_IDS.has(p.id)))
const imagePresets = computed(() => staticPresets.filter((p) => IMAGE_PRESET_IDS.has(p.id)))

const activeTab = ref('video')
const selectedTileId = ref('')
const dragging = ref(false)
const advancedOpen = ref<string[]>([])

const files = ref<string[]>([])
const fileInfos = reactive<Record<string, MediaInfo>>({})
const outputDir = ref<string>('')
const outputDirText = ref('')
const tasks = ref<ConvertTask[]>([])
const engineReady = ref(false)
const engineText = ref('')
const hardwareEncoders = ref<string[]>([])

const options = reactive<ConvertOptions>({ outputFormat: 'mp4' })
const fpsText = ref('')
const startText = ref('')
const endText = ref('')
const targetSizeText = ref('')

const mode = ref<'convert' | 'merge' | 'frame' | 'tag'>('convert')

const mergeFiles = ref<string[]>([])
const mergeFormat = ref('mp4')
const mergeDragging = ref(false)

const frameFile = ref('')
const frameFormat = ref('jpg')
const frameTimeText = ref('')
const frameDragging = ref(false)

const tagFile = ref('')
const tagDragging = ref(false)
const tagCover = ref('')
const tagFields = reactive<AudioTags>({})

const hasFiles = computed(() => files.value.length > 0)

const cancelProgress = ref<(() => void) | null>(null)
const cancelDone = ref<(() => void) | null>(null)

const STORAGE_KEY = 'change.defaultConfig'

const isHardwareSelected = computed(() => {
  const vc = options.videoCodec || ''
  return hardwareEncoders.value.includes(vc)
})

const hardwareShort = computed(() => {
  const vc = options.videoCodec || ''
  return isHardwareSelected.value ? encLabel(vc) : ''
})

function saveConfig(): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ options: { ...options }, fpsText: fpsText.value })
    )
  } catch {
    /* ignore */
  }
}

function loadConfig(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (data.options && typeof data.options === 'object') {
      Object.assign(options, data.options)
    }
    if (data.fpsText) fpsText.value = data.fpsText
  } catch {
    /* ignore */
  }
}

watch(options, saveConfig, { deep: true })
watch(fpsText, saveConfig)

function tileIcon(p: Preset): Component {
  return ICON_MAP[p.tile?.icon || 'video'] || VideoPlay
}

function tileTitle(p: Preset): string {
  return p.tile?.title || p.options.outputFormat.toUpperCase()
}

function tileSub(p: Preset): string {
  const s = p.tile?.sub || ''
  if (locale.value === 'en') return tileSubEn[s] || s
  return s
}

function codecFamily(codec: string): string {
  const c = codec.toLowerCase()
  if (c.includes('h264') || c === 'libx264') return 'h264'
  if (c.includes('hevc') || c.includes('h265') || c === 'libx265') return 'hevc'
  if (c.includes('av1') || c === 'libaom-av1') return 'av1'
  if (c.includes('vp9')) return 'vp9'
  if (c.includes('vp8')) return 'vp8'
  if (c.includes('mpeg4') || c.includes('xvid')) return 'mpeg4'
  if (c.includes('mpeg2')) return 'mpeg2'
  if (c.includes('mpeg1')) return 'mpeg1'
  if (c.includes('wmv')) return 'wmv'
  if (c.includes('theora')) return 'theora'
  return c
}

function vendorOf(codec: string): string {
  const c = codec.toLowerCase()
  if (c.includes('nvenc')) return 'nvenc'
  if (c.includes('amf')) return 'amf'
  if (c.includes('qsv')) return 'qsv'
  return ''
}

function findHardwareEncoder(family: string): string | undefined {
  const vendor = vendorOf(options.videoCodec || '')
  const candidates = hardwareEncoders.value.filter((e) => codecFamily(e) === family)
  if (vendor) {
    const sameVendor = candidates.find((e) => e.includes(vendor))
    if (sameVendor) return sameVendor
  }
  return candidates[0]
}

function applyTile(preset: Preset): void {
  selectedTileId.value = preset.id
  const o = preset.options
  options.outputFormat = o.outputFormat
  if (o.videoCodec) {
    if (isHardwareSelected.value) {
      options.videoCodec = findHardwareEncoder(codecFamily(o.videoCodec)) || o.videoCodec
    } else {
      options.videoCodec = o.videoCodec
    }
  } else {
    options.videoCodec = ''
  }
  options.audioCodec = o.audioCodec ?? ''
  options.videoBitrate = o.videoBitrate ?? ''
  options.audioBitrate = o.audioBitrate ?? ''
  options.resolution = o.resolution ?? ''
  fpsText.value = o.fps ? String(o.fps) : ''
  startText.value = ''
  endText.value = ''
}

function encLabel(enc: string): string {
  return HARDWARE_ENCODER_LABELS[enc] || enc
}

function basename(p: string): string {
  return p.split(/[\\/]/).pop() || p
}

function formatSize(bytes?: number): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const s = Math.round(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

function formatMediaInfo(info: MediaInfo | undefined): string {
  if (!info) return ''
  const parts: string[] = []
  if (info.duration) parts.push(formatDuration(info.duration))
  if (info.width && info.height) parts.push(`${info.width}x${info.height}`)
  if (info.videoCodec) parts.push(info.videoCodec)
  else if (info.audioCodec) parts.push(info.audioCodec)
  return parts.join(' · ')
}

async function pickFiles(): Promise<void> {
  const picked = await api.pickFiles([
    {
      name: '多媒体文件',
      extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'ts', 'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'jpg', 'png', 'webp', 'bmp', 'gif']
    }
  ])
  if (picked.length) addFiles(picked)
}

function onDrop(): void {
  dragging.value = false
}

function handleDrop(paths: string[]): void {
  if (!paths || !paths.length) return
  if (mode.value === 'merge') {
    const existing = new Set(mergeFiles.value)
    for (const p of paths) if (!existing.has(p)) existing.add(p)
    mergeFiles.value = [...existing]
  } else if (mode.value === 'frame') {
    frameFile.value = paths[0]
  } else if (mode.value === 'tag') {
    setTagFile(paths[0])
  } else {
    addFiles(paths)
  }
}

function addFiles(paths: string[]): void {
  const existing = new Set(files.value)
  for (const p of paths) {
    if (!existing.has(p)) {
      existing.add(p)
      void probeInfo(p)
    }
  }
  files.value = [...existing]
}

async function probeInfo(path: string): Promise<void> {
  try {
    const info = await api.probeMediaInfo(path)
    fileInfos[path] = info
  } catch {
    /* ignore */
  }
}

function removeFile(i: number): void {
  files.value = files.value.filter((_, idx) => idx !== i)
}

function clearFiles(): void {
  files.value = []
}

async function pickOutDir(): Promise<void> {
  const dir = await api.pickDirectory()
  if (dir) {
    outputDir.value = dir
    outputDirText.value = dir
  }
}

async function addTasks(): Promise<void> {
  const opts: ConvertOptions = {
    ...options,
    fps: fpsText.value ? Number(fpsText.value) : undefined,
    startTime: startText.value ? Number(startText.value) : undefined,
    endTime: endText.value ? Number(endText.value) : undefined,
    targetSize: targetSizeText.value ? Number(targetSizeText.value) * 1024 * 1024 : undefined,
    outputDir: outputDir.value || undefined
  }
  for (const f of files.value) {
    await api.addTask(f, opts)
  }
  files.value = []
  ElMessage.success(t('msg.taskAdded'))
  tasks.value = await api.listTasks()
}

async function cancel(id: string): Promise<void> {
  await api.cancelTask(id)
}

async function retry(id: string): Promise<void> {
  const ok = await api.retryTask(id)
  if (ok) {
    ElMessage.success(t('msg.taskAdded'))
    tasks.value = await api.listTasks()
  }
}

async function clearFinished(): Promise<void> {
  await api.clearFinished()
  tasks.value = await api.listTasks()
}

function openFile(path: string): void {
  api.openInFolder(path)
}

const VIDEO_PICK_FILTER = [
  { name: '视频文件', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'ts', 'm2ts', 'wmv', 'm4v', 'mpg', '3gp'] }
]

async function pickMergeFiles(): Promise<void> {
  const picked = await api.pickFiles(VIDEO_PICK_FILTER)
  if (picked.length) {
    const existing = new Set(mergeFiles.value)
    for (const p of picked) if (!existing.has(p)) existing.add(p)
    mergeFiles.value = [...existing]
  }
}

function onMergeDrop(): void {
  mergeDragging.value = false
}

function removeMergeFile(i: number): void {
  mergeFiles.value = mergeFiles.value.filter((_, idx) => idx !== i)
}

async function doMerge(): Promise<void> {
  const opts: ConvertOptions = {
    outputFormat: mergeFormat.value,
    videoCodec: isHardwareSelected.value ? options.videoCodec : 'libx264',
    audioCodec: 'aac',
    mergeInputs: mergeFiles.value.slice(1),
    outputDir: outputDir.value || undefined
  }
  await api.addTask(mergeFiles.value[0], opts)
  mergeFiles.value = []
  ElMessage.success(t('msg.mergeAdded'))
  tasks.value = await api.listTasks()
}

async function pickFrameFile(): Promise<void> {
  const picked = await api.pickFiles(VIDEO_PICK_FILTER)
  if (picked.length) frameFile.value = picked[0]
}

function onFrameDrop(): void {
  frameDragging.value = false
}

function clearFrameFile(): void {
  frameFile.value = ''
}

async function doFrame(): Promise<void> {
  const opts: ConvertOptions = {
    outputFormat: frameFormat.value,
    frameTime: parseFrameTime(frameTimeText.value),
    outputDir: outputDir.value || undefined
  }
  await api.addTask(frameFile.value, opts)
  frameFile.value = ''
  ElMessage.success(t('msg.frameAdded'))
  tasks.value = await api.listTasks()
}

function parseFrameTime(text: string): number | undefined {
  if (!text.trim()) return 0
  if (text.includes(':')) {
    const parts = text.split(':').map(Number)
    if (parts.some((n) => Number.isNaN(n))) return 0
    let secs = 0
    for (const p of parts) secs = secs * 60 + p
    return secs
  }
  const n = Number(text)
  return Number.isNaN(n) ? 0 : n
}

const AUDIO_PICK_FILTER = [
  { name: '音频文件', extensions: ['mp3', 'flac', 'm4a', 'ogg', 'opus', 'wav', 'aac', 'wma'] }
]
const IMAGE_PICK_FILTER = [
  { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] }
]

async function pickTagFile(): Promise<void> {
  const picked = await api.pickFiles(AUDIO_PICK_FILTER)
  if (!picked.length) return
  await setTagFile(picked[0])
}

async function setTagFile(path: string): Promise<void> {
  tagFile.value = path
  tagCover.value = ''
  Object.assign(tagFields, { title: '', artist: '', album: '', date: '', comment: '', lyrics: '' })
  const tags = await api.readAudioTags(path)
  Object.assign(tagFields, tags)
}

function onTagDrop(): void {
  tagDragging.value = false
}

function clearTagFile(): void {
  tagFile.value = ''
  tagCover.value = ''
}

async function pickCover(): Promise<void> {
  const picked = await api.pickFiles(IMAGE_PICK_FILTER)
  if (picked.length) tagCover.value = picked[0]
}

function clearCover(): void {
  tagCover.value = ''
}

async function saveTags(): Promise<void> {
  if (!tagFile.value) {
    ElMessage.warning(t('tag.noFile'))
    return
  }
  const ok = await api.writeAudioTags(tagFile.value, { ...tagFields }, tagCover.value || '')
  if (ok) ElMessage.success(t('msg.tagSaved'))
  else ElMessage.error(t('msg.tagFailed'))
}

function statusText(s: string): string {
  const map: Record<string, string> = {
    queued: t('st.queued'),
    running: t('st.running'),
    done: t('st.done'),
    error: t('st.error'),
    cancelled: t('st.cancelled')
  }
  return map[s] || s
}

function statusTagType(s: ConvertTask['status']): 'info' | 'primary' | 'success' | 'danger' | 'warning' {
  const map: Record<ConvertTask['status'], 'info' | 'primary' | 'success' | 'danger' | 'warning'> = {
    queued: 'info',
    running: 'primary',
    done: 'success',
    error: 'danger',
    cancelled: 'warning'
  }
  return map[s]
}

function progressStatus(s: ConvertTask['status']): 'success' | 'exception' {
  return s === 'error' ? 'exception' : 'success'
}

function onFileMenu(cmd: string): void {
  if (cmd === 'addFiles') pickFiles()
  else if (cmd === 'pickOutDir') pickOutDir()
  else if (cmd === 'quit') api.quitApp()
}

function onHelpMenu(cmd: string): void {
  if (cmd === 'about') {
    ElMessageBox.alert(
      `Change ${APP_VERSION}\n\n${t('about.content')}`,
      t('menu.about'),
      { confirmButtonText: t('about.ok') }
    )
  } else if (cmd === 'github') {
    api.openExternal(GITHUB_URL)
  } else if (cmd === 'ffmpeg') {
    ElMessageBox.alert(
      engineText.value || t('status.unavailable'),
      t('menu.ffmpegVersion'),
      { confirmButtonText: t('ffmpeg.ok') }
    )
  } else if (cmd === 'lang-zh') {
    switchLocale('zh')
  } else if (cmd === 'lang-en') {
    switchLocale('en')
  }
}

function switchLocale(l: Locale): void {
  setLocale(l)
  void api.setLocale(l)
  ElMessage.success(l === 'zh' ? t('msg.langSaved') : t('msg.langSavedEn'))
}

function onHardwareMenu(cmd: string): void {
  if (cmd === 'auto') {
    options.videoCodec = ''
    ElMessage.success(t('msg.autoEncoder'))
  } else {
    void ElMessageBox.confirm(t('hw.warningContent'), t('hw.warningTitle'), {
      confirmButtonText: t('hw.warningConfirm'),
      cancelButtonText: t('hw.warningCancel'),
      type: 'warning'
    })
      .then(() => {
        options.videoCodec = cmd
        ElMessage.success(`${t('msg.hwDefault')}${encLabel(cmd)}`)
      })
      .catch(() => {
        /* 用户取消 */
      })
  }
}

onMounted(async () => {
  tasks.value = await api.listTasks()
  const ver = await api.ffmpegVersion()
  if (ver && !ver.startsWith('未检测到')) {
    engineReady.value = true
    engineText.value = ver
  } else {
    engineText.value = ver || 'FFmpeg 不可用'
  }
  const encoders = await api.listEncoders()
  hardwareEncoders.value = encoders
  loadConfig()
  cancelProgress.value = EventsOn('task:progress', (e) => {
    const t = tasks.value.find((x) => x.id === e.id)
    if (t) {
      t.progress = e.progress
      t.detail = e.detail
    }
  })
  cancelDone.value = EventsOn('task:done', async (t) => {
    const idx = tasks.value.findIndex((x) => x.id === t.id)
    if (idx >= 0) tasks.value[idx] = t
    else tasks.value.unshift(t)
  })
  OnFileDrop((_x, _y, files) => handleDrop(files), false)
})

onBeforeUnmount(() => {
  if (cancelProgress.value) cancelProgress.value()
  if (cancelDone.value) cancelDone.value()
})
</script>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.menu-bar {
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #ebeef5;
  user-select: none;
  position: relative;
}
.menu-left {
  display: flex;
  align-items: center;
  gap: 4px;
}
.menu-item {
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  color: #303133;
  font-size: 14px;
  transition: background 0.15s;
}
.menu-item:hover {
  background: #f0effd;
  color: var(--el-color-primary);
}
.menu-item-active {
  color: var(--el-color-primary);
  font-weight: 500;
}
.brand {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  font-weight: 700;
  color: #1f2328;
  pointer-events: none;
}
.engine-status {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mode-switch-card {
  display: flex;
  justify-content: center;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}
.queue-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 10px;
}
.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 8px 12px;
  border-radius: 10px;
  border: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}
.tile:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.12);
}
.tile.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.tile-icon {
  color: var(--el-color-primary);
}
.tile-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.tile-sub {
  font-size: 12px;
  color: #909399;
}

.drop-zone {
  border: 2px dashed #d0d5dd;
  border-radius: 12px;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.drop-zone:hover,
.drop-zone.dragging {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.drop-icon {
  color: var(--el-color-primary);
}
.drop-text {
  font-size: 15px;
  color: #303133;
}
.drop-hint {
  font-size: 12px;
  color: #909399;
}
.file-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 14px;
}
.file-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}
.file-row-icon {
  color: var(--el-color-primary);
  flex-shrink: 0;
}
.file-row-main {
  flex: 1;
  min-width: 0;
}
.file-row-name {
  font-size: 13px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-row-info {
  font-size: 12px;
  color: #909399;
}
.file-row-remove {
  flex-shrink: 0;
}

.opt-form :deep(.el-input__inner[readonly]) {
  cursor: pointer;
  color: var(--el-text-color-regular);
}
.range-sep {
  margin: 0 8px;
  color: var(--el-text-color-secondary);
}
.hint {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  justify-content: center;
}
.file-cell {
  color: #303133;
}
.size-cell {
  font-size: 12px;
  color: #909399;
}
</style>
