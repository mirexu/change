package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
)

// ffmpegPath 解析 ffmpeg 二进制路径
func ffmpegPath() string {
	// 1. 打包后:与可执行文件同目录下的 ffmpeg
	if exe, err := os.Executable(); err == nil {
		dir := filepath.Dir(exe)
		name := "ffmpeg"
		if runtime.GOOS == "windows" {
			name = "ffmpeg.exe"
		}
		candidate := filepath.Join(dir, name)
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	// 2. 开发时:从 PATH 查找
	if p, err := exec.LookPath("ffmpeg"); err == nil {
		return p
	}
	return "ffmpeg"
}

var (
	reDuration = regexp.MustCompile(`Duration:\s*(\d+):(\d+):(\d+\.\d+)`)
	reTime     = regexp.MustCompile(`time=(\d+):(\d+):(\d+\.\d+)`)
	reRes      = regexp.MustCompile(`(\d{2,5})x(\d{2,5})`)
	reFPS      = regexp.MustCompile(`([\d.]+)\s*fps`)
	reHz       = regexp.MustCompile(`(\d+)\s*Hz`)
	reKbps     = regexp.MustCompile(`(\d+)\s*kb/s`)
)

func parseSeconds(h, m, s string) float64 {
	hh, _ := strconv.ParseFloat(h, 64)
	mm, _ := strconv.ParseFloat(m, 64)
	ss, _ := strconv.ParseFloat(s, 64)
	return hh*3600 + mm*60 + ss
}

// FfmpegVersion 返回 ffmpeg 版本信息
func (a *App) FfmpegVersion() string {
	out, err := exec.Command(ffmpegPath(), "-version").Output()
	if err != nil {
		return "未检测到 ffmpeg"
	}
	lines := strings.Split(string(out), "\n")
	if len(lines) > 0 {
		return lines[0]
	}
	return string(out)
}

// ListEncoders 返回可用的硬件编码器
func (a *App) ListEncoders() []string {
	out, err := exec.Command(ffmpegPath(), "-hide_banner", "-encoders").Output()
	if err != nil {
		return []string{}
	}
	re := regexp.MustCompile(`\b(h264_nvenc|hevc_nvenc|av1_nvenc|h264_amf|hevc_amf|av1_amf|h264_qsv|hevc_qsv|av1_qsv)\b`)
	seen := map[string]bool{}
	var result []string
	for _, m := range re.FindAllStringSubmatch(string(out), -1) {
		if !seen[m[1]] {
			seen[m[1]] = true
			result = append(result, m[1])
		}
	}
	return result
}

// probeMediaInfo 探测媒体信息
func probeMediaInfo(inputPath string) MediaInfo {
	info := MediaInfo{}
	cmd := exec.Command(ffmpegPath(), "-hide_banner", "-i", inputPath)
	out, _ := cmd.CombinedOutput()
	stderr := string(out)

	if m := reDuration.FindStringSubmatch(stderr); m != nil {
		info.Duration = parseSeconds(m[1], m[2], m[3])
	}
	lines := strings.Split(stderr, "\n")
	for _, line := range lines {
		if strings.Contains(line, "Video:") {
			if m := reRes.FindStringSubmatch(line); m != nil {
				info.Width, _ = strconv.Atoi(m[1])
				info.Height, _ = strconv.Atoi(m[2])
			}
			if m := reFPS.FindStringSubmatch(line); m != nil {
				info.FPS, _ = strconv.ParseFloat(m[1], 64)
			}
			if idx := strings.Index(line, "Video: "); idx >= 0 {
				rest := line[idx+len("Video: "):]
				if sp := strings.IndexAny(rest, " ,"); sp >= 0 {
					info.VideoCodec = rest[:sp]
				}
			}
		}
		if strings.Contains(line, "Audio:") {
			if idx := strings.Index(line, "Audio: "); idx >= 0 {
				rest := line[idx+len("Audio: "):]
				if sp := strings.IndexAny(rest, " ,"); sp >= 0 {
					info.AudioCodec = rest[:sp]
				}
			}
			if m := reHz.FindStringSubmatch(line); m != nil {
				info.AudioSampleRate, _ = strconv.Atoi(m[1])
			}
			if strings.Contains(line, "stereo") {
				info.AudioChannels = 2
			} else if strings.Contains(line, "mono") {
				info.AudioChannels = 1
			}
			if m := reKbps.FindStringSubmatch(line); m != nil {
				info.AudioBitrate, _ = strconv.Atoi(m[1])
			}
		}
	}
	return info
}

// probeDuration 探测时长(秒)
func probeDuration(inputPath string) (float64, error) {
	cmd := exec.Command(ffmpegPath(), "-hide_banner", "-i", inputPath)
	out, _ := cmd.CombinedOutput()
	if m := reDuration.FindStringSubmatch(string(out)); m != nil {
		return parseSeconds(m[1], m[2], m[3]), nil
	}
	return 0, nil
}

// probeAudioBitrate 探测源音频码率(kbps)
func probeAudioBitrate(inputPath string) (int, error) {
	cmd := exec.Command(ffmpegPath(), "-hide_banner", "-i", inputPath)
	out, _ := cmd.CombinedOutput()
	lines := strings.Split(string(out), "\n")
	for _, line := range lines {
		if strings.Contains(line, "Audio:") {
			if m := reKbps.FindStringSubmatch(line); m != nil {
				v, _ := strconv.Atoi(m[1])
				return v, nil
			}
		}
	}
	return 0, nil
}
