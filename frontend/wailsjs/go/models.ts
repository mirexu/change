export namespace main {
	
	export class AudioTags {
	    title?: string;
	    artist?: string;
	    album?: string;
	    date?: string;
	    comment?: string;
	    lyrics?: string;
	
	    static createFrom(source: any = {}) {
	        return new AudioTags(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.artist = source["artist"];
	        this.album = source["album"];
	        this.date = source["date"];
	        this.comment = source["comment"];
	        this.lyrics = source["lyrics"];
	    }
	}
	export class ConvertOptions {
	    outputFormat: string;
	    videoCodec?: string;
	    audioCodec?: string;
	    videoBitrate?: string;
	    audioBitrate?: string;
	    resolution?: string;
	    fps?: number;
	    startTime?: number;
	    endTime?: number;
	    outputDir?: string;
	    mergeInputs?: string[];
	    targetSize?: number;
	    frameTime?: number;
	
	    static createFrom(source: any = {}) {
	        return new ConvertOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.outputFormat = source["outputFormat"];
	        this.videoCodec = source["videoCodec"];
	        this.audioCodec = source["audioCodec"];
	        this.videoBitrate = source["videoBitrate"];
	        this.audioBitrate = source["audioBitrate"];
	        this.resolution = source["resolution"];
	        this.fps = source["fps"];
	        this.startTime = source["startTime"];
	        this.endTime = source["endTime"];
	        this.outputDir = source["outputDir"];
	        this.mergeInputs = source["mergeInputs"];
	        this.targetSize = source["targetSize"];
	        this.frameTime = source["frameTime"];
	    }
	}
	export class ConvertTask {
	    id: string;
	    inputPath: string;
	    outputPath: string;
	    status: string;
	    progress: number;
	    detail: string;
	    error?: string;
	    inputSize?: number;
	    outputSize?: number;
	    createdAt: number;
	    finishedAt?: number;
	
	    static createFrom(source: any = {}) {
	        return new ConvertTask(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.inputPath = source["inputPath"];
	        this.outputPath = source["outputPath"];
	        this.status = source["status"];
	        this.progress = source["progress"];
	        this.detail = source["detail"];
	        this.error = source["error"];
	        this.inputSize = source["inputSize"];
	        this.outputSize = source["outputSize"];
	        this.createdAt = source["createdAt"];
	        this.finishedAt = source["finishedAt"];
	    }
	}
	export class MediaInfo {
	    duration?: number;
	    width?: number;
	    height?: number;
	    fps?: number;
	    videoCodec?: string;
	    audioCodec?: string;
	    audioSampleRate?: number;
	    audioChannels?: number;
	    audioBitrate?: number;
	
	    static createFrom(source: any = {}) {
	        return new MediaInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.duration = source["duration"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.fps = source["fps"];
	        this.videoCodec = source["videoCodec"];
	        this.audioCodec = source["audioCodec"];
	        this.audioSampleRate = source["audioSampleRate"];
	        this.audioChannels = source["audioChannels"];
	        this.audioBitrate = source["audioBitrate"];
	    }
	}

}

