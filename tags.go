package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
)

// readAudioTags 读取音频标签
func readAudioTags(inputPath string) AudioTags {
	var tags AudioTags
	out, _ := exec.Command(ffmpegPath(), "-hide_banner", "-i", inputPath).CombinedOutput()
	stderr := string(out)

	// 提取 Metadata 块
	meta := map[string]string{}
	reBlock := regexp.MustCompile(`Metadata:[\s\S]*?(?=\n\s*Duration|\n\s*Stream|\n\s*$)`)
	if m := reBlock.FindString(stderr); m != "" {
		reKV := regexp.MustCompile(`(?m)^\s*([^:]+?)\s*:\s*(.*)$`)
		for _, kv := range reKV.FindAllStringSubmatch(m, -1) {
			key := strings.ToLower(strings.TrimSpace(kv[1]))
			meta[key] = strings.TrimSpace(kv[2])
		}
	}
	tags.Title = meta["title"]
	tags.Artist = meta["artist"]
	tags.Album = meta["album"]
	tags.Date = meta["date"]
	tags.Comment = meta["comment"]
	tags.Lyrics = meta["lyrics"]
	return tags
}

// writeAudioTags 写入音频标签,流复制不重编码,原地替换
func writeAudioTags(inputPath string, tags AudioTags, coverPath string) error {
	dir := filepath.Dir(inputPath)
	ext := filepath.Ext(inputPath)
	base := strings.TrimSuffix(filepath.Base(inputPath), ext)
	tmp := filepath.Join(dir, base+".tagged"+ext)

	args := []string{"-hide_banner", "-i", inputPath}
	if coverPath != "" {
		args = append(args, "-i", coverPath)
	}
	if coverPath != "" {
		args = append(args, "-map", "0:a:0", "-map", "1:v:0")
	} else {
		args = append(args, "-map", "0")
	}
	args = append(args, "-c", "copy")

	if coverPath != "" {
		if strings.ToLower(ext) == ".mp3" {
			args = append(args, "-id3v2_version", "3")
			args = append(args, "-metadata:s:v", "title=Album cover", "-metadata:s:v", "comment=Cover (front)")
		} else {
			args = append(args, "-disposition:v:0", "attached_pic")
		}
	}

	if tags.Title != "" {
		args = append(args, "-metadata", fmt.Sprintf("title=%s", tags.Title))
	}
	if tags.Artist != "" {
		args = append(args, "-metadata", fmt.Sprintf("artist=%s", tags.Artist))
	}
	if tags.Album != "" {
		args = append(args, "-metadata", fmt.Sprintf("album=%s", tags.Album))
	}
	if tags.Date != "" {
		args = append(args, "-metadata", fmt.Sprintf("date=%s", tags.Date))
	}
	if tags.Comment != "" {
		args = append(args, "-metadata", fmt.Sprintf("comment=%s", tags.Comment))
	}
	if tags.Lyrics != "" {
		args = append(args, "-metadata", fmt.Sprintf("lyrics=%s", tags.Lyrics))
	}
	args = append(args, "-y", tmp)

	if out, err := exec.Command(ffmpegPath(), args...).CombinedOutput(); err != nil {
		_ = os.Remove(tmp)
		return fmt.Errorf("%v: %s", err, string(out))
	}

	_ = os.Remove(inputPath)
	return os.Rename(tmp, inputPath)
}
