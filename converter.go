package main

import (
	"bufio"
	"fmt"
	"io"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
)

var maxAudioBitrate = map[string]int{
	"mp3": 320, "aac": 512, "m4a": 512, "ogg": 500, "opus": 510,
	"ac3": 640, "eac3": 640, "mp2": 384, "wma": 320, "dts": 1536,
	"amr": 12, "spx": 44,
}

var losslessAudio = map[string]bool{
	"flac": true, "wav": true, "pcm_s16le": true, "alac": true, "ape": true,
	"aiff": true, "au": true, "caf": true,
}

var noAutoBitrate = map[string]bool{"dts": true, "amr": true, "spx": true}

func buildOutputPath(inputPath string, opts ConvertOptions) string {
	dir := opts.OutputDir
	if dir == "" {
		dir = filepath.Dir(inputPath)
	}
	base := strings.TrimSuffix(filepath.Base(inputPath), filepath.Ext(inputPath))
	return filepath.Join(dir, base+"."+opts.OutputFormat)
}

// resolveAudioBitrate 计算目标音频码率,返回空字符串表示不设置
func resolveAudioBitrate(inputPath string, opts ConvertOptions) string {
	if opts.AudioBitrate != "" {
		return opts.AudioBitrate
	}
	if opts.AudioCodec == "copy" || losslessAudio[opts.AudioCodec] || losslessAudio[opts.OutputFormat] || noAutoBitrate[opts.OutputFormat] {
		return ""
	}
	src, err := probeAudioBitrate(inputPath)
	if err != nil || src == 0 {
		return ""
	}
	max := maxAudioBitrate[opts.OutputFormat]
	if v, ok := maxAudioBitrate[opts.AudioCodec]; ok {
		max = v
	}
	if max == 0 {
		max = 512
	}
	target := src
	if target > max {
		target = max
	}
	if target < 32 {
		target = 32
	}
	return fmt.Sprintf("%dk", target)
}

// runConversion 执行转换,返回已启动的进程(调用方负责 Wait),onProgress 回调进度(0-99)
func runConversion(task *ConvertTask, opts ConvertOptions, onProgress func(int, string)) (*exec.Cmd, error) {
	var args []string
	isMerge := len(opts.MergeInputs) > 0

	if isMerge {
		args = append(args, "-i", task.InputPath)
		for _, p := range opts.MergeInputs {
			args = append(args, "-i", p)
		}
		total := len(opts.MergeInputs) + 1
		var parts []string
		for i := 0; i < total; i++ {
			parts = append(parts, fmt.Sprintf("[%d:v:0][%d:a:0]", i, i))
		}
		filter := strings.Join(parts, "") + fmt.Sprintf("concat=n=%d:v=1:a=1[v][a]", total)
		args = append(args, "-filter_complex", filter, "-map", "[v]", "-map", "[a]")
	} else {
		args = append(args, "-i", task.InputPath)
	}

	if opts.VideoCodec != "" {
		args = append(args, "-c:v", opts.VideoCodec)
		if regexp.MustCompile(`nvenc|amf|qsv`).MatchString(opts.VideoCodec) {
			args = append(args, "-pix_fmt", "yuv420p")
		}
	}
	if opts.AudioCodec != "" {
		args = append(args, "-c:a", opts.AudioCodec)
	}
	if opts.AudioCodec == "flac" {
		args = append(args, "-sample_fmt", "s16")
	}
	if opts.AudioCodec == "dca" {
		args = append(args, "-strict", "-2")
	}
	if opts.AudioCodec == "libopencore_amrnb" {
		args = append(args, "-ac", "1", "-ar", "8000")
	}

	if opts.FrameTime != nil {
		// 截帧模式
		if *opts.FrameTime > 0 {
			args = append(args, "-ss", fmt.Sprintf("%.3f", *opts.FrameTime))
		}
		args = append(args, "-frames:v", "1", "-an")
	} else {
		if opts.VideoBitrate != "" {
			args = append(args, "-b:v", opts.VideoBitrate)
		}
		if opts.AudioBitrate != "" {
			args = append(args, "-b:a", opts.AudioBitrate)
		}
		if opts.FPS > 0 {
			args = append(args, "-r", fmt.Sprintf("%v", opts.FPS))
		}
		if opts.OutputFormat == "ico" {
			args = append(args, "-vf", "scale=256:256:force_original_aspect_ratio=decrease")
		} else if opts.Resolution != "" {
			args = append(args, "-s", opts.Resolution)
		}
		if opts.StartTime > 0 {
			args = append(args, "-ss", fmt.Sprintf("%.3f", opts.StartTime))
		}
		if opts.EndTime > 0 {
			if opts.StartTime > 0 {
				args = append(args, "-t", fmt.Sprintf("%.3f", opts.EndTime-opts.StartTime))
			} else {
				args = append(args, "-t", fmt.Sprintf("%.3f", opts.EndTime))
			}
		}
	}

	args = append(args, "-y", task.OutputPath)

	cmd := exec.Command(ffmpegPath(), args...)
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, err
	}
	if err := cmd.Start(); err != nil {
		return nil, err
	}

	// 读取 stderr,解析进度
	var totalDuration float64
	go func() {
		reader := bufio.NewReader(stderr)
		for {
			line, err := reader.ReadString('\n')
			if line != "" {
				if m := reDuration.FindStringSubmatch(line); m != nil {
					totalDuration += parseSeconds(m[1], m[2], m[3])
				}
				if m := reTime.FindStringSubmatch(line); m != nil && totalDuration > 0 {
					t := parseSeconds(m[1], m[2], m[3])
					p := int(t / totalDuration * 100)
					if p > 99 {
						p = 99
					}
					onProgress(p, "转换中")
				}
			}
			if err == io.EOF {
				break
			}
		}
	}()

	return cmd, nil
}
