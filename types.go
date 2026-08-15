package main

// ConvertOptions 转换选项(与前端 ConvertOptions 对应)
type ConvertOptions struct {
	OutputFormat string  `json:"outputFormat"`
	VideoCodec   string  `json:"videoCodec,omitempty"`
	AudioCodec   string  `json:"audioCodec,omitempty"`
	VideoBitrate string  `json:"videoBitrate,omitempty"`
	AudioBitrate string  `json:"audioBitrate,omitempty"`
	Resolution   string  `json:"resolution,omitempty"`
	FPS          float64 `json:"fps,omitempty"`
	StartTime    float64 `json:"startTime,omitempty"`
	EndTime      float64 `json:"endTime,omitempty"`
	OutputDir    string   `json:"outputDir,omitempty"`
	MergeInputs  []string `json:"mergeInputs,omitempty"`
	TargetSize   int64    `json:"targetSize,omitempty"`
	FrameTime    *float64 `json:"frameTime,omitempty"`
}

// ConvertTask 转换任务(与前端 ConvertTask 对应)
type ConvertTask struct {
	ID         string  `json:"id"`
	InputPath  string  `json:"inputPath"`
	OutputPath string  `json:"outputPath"`
	Status     string  `json:"status"` // queued | running | done | error | cancelled
	Progress   int     `json:"progress"`
	Detail     string  `json:"detail"`
	Error      string  `json:"error,omitempty"`
	InputSize  int64   `json:"inputSize,omitempty"`
	OutputSize int64   `json:"outputSize,omitempty"`
	CreatedAt  int64   `json:"createdAt"`
	FinishedAt int64   `json:"finishedAt,omitempty"`
}

// MediaInfo 媒体文件信息
type MediaInfo struct {
	Duration       float64 `json:"duration,omitempty"`
	Width          int     `json:"width,omitempty"`
	Height         int     `json:"height,omitempty"`
	FPS            float64 `json:"fps,omitempty"`
	VideoCodec     string  `json:"videoCodec,omitempty"`
	AudioCodec     string  `json:"audioCodec,omitempty"`
	AudioSampleRate int    `json:"audioSampleRate,omitempty"`
	AudioChannels  int     `json:"audioChannels,omitempty"`
	AudioBitrate   int     `json:"audioBitrate,omitempty"`
}

// AudioTags 音频标签
type AudioTags struct {
	Title   string `json:"title,omitempty"`
	Artist  string `json:"artist,omitempty"`
	Album   string `json:"album,omitempty"`
	Date    string `json:"date,omitempty"`
	Comment string `json:"comment,omitempty"`
	Lyrics  string `json:"lyrics,omitempty"`
}

// TaskProgressEvent 进度事件
type TaskProgressEvent struct {
	ID       string `json:"id"`
	Progress int    `json:"progress"`
	Detail   string `json:"detail"`
}
