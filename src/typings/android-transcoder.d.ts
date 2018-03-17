declare module net {
	export module ypresto {
		export module androidtranscoder {
			export class BuildConfig {
				public static DEBUG: boolean;
				public static APPLICATION_ID: string;
				public static BUILD_TYPE: string;
				public static FLAVOR: string;
				public static VERSION_CODE: number;
				public static VERSION_NAME: string;
				public constructor();
			}
		}
	}
}

import javaioFileDescriptor = java.io.FileDescriptor;
import javautilconcurrentFuture = java.util.concurrent.Future;
import javalangException = java.lang.Exception;
/// <reference path="./java.io.FileDescriptor.d.ts" />
/// <reference path="./java.lang.Exception.d.ts" />
/// <reference path="./java.lang.String.d.ts" />
/// <reference path="./java.util.concurrent.Future.d.ts" />
/// <reference path="./net.ypresto.androidtranscoder.format.MediaFormatStrategy.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export class MediaTranscoder {
				public transcodeVideo(param0: javaioFileDescriptor, param1: string, param2: net.ypresto.androidtranscoder.MediaTranscoder.Listener): java.util.concurrent.Future<void>;
				public transcodeVideo(param0: javaioFileDescriptor, param1: string, param2: net.ypresto.androidtranscoder.format.MediaFormatStrategy, param3: net.ypresto.androidtranscoder.MediaTranscoder.Listener): java.util.concurrent.Future<void>;
				public transcodeVideo(param0: string, param1: string, param2: net.ypresto.androidtranscoder.format.MediaFormatStrategy, param3: net.ypresto.androidtranscoder.MediaTranscoder.Listener): java.util.concurrent.Future<void>;
				public static getInstance(): net.ypresto.androidtranscoder.MediaTranscoder;
			}
			export module MediaTranscoder {
				export class Listener {
					/**
					 * Constructs a new instance of the net.ypresto.androidtranscoder.MediaTranscoder$Listener interface with the provided implementation.
					 */
					public constructor(implementation: {
						onTranscodeProgress(param0: number): void;
						onTranscodeCompleted(): void;
						onTranscodeCanceled(): void;
						onTranscodeFailed(param0: javalangException): void;
					});
					public onTranscodeFailed(param0: javalangException): void;
					public onTranscodeCompleted(): void;
					public onTranscodeProgress(param0: number): void;
					public onTranscodeCanceled(): void;
				}
			}
		}
	}
}

import androidmediaMediaCodec = android.media.MediaCodec;
import javanioByteBuffer = java.nio.ByteBuffer;
/// <reference path="./android.media.MediaCodec.d.ts" />
/// <reference path="./java.nio.ByteBuffer.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module compat {
				export class MediaCodecBufferCompatWrapper {
					public constructor(param0: androidmediaMediaCodec);
					public getInputBuffer(param0: number): javanioByteBuffer;
					public getOutputBuffer(param0: number): javanioByteBuffer;
				}
			}
		}
	}
}

import androidmediaMediaFormat = android.media.MediaFormat;
import androidmediaMediaCodecInfo = android.media.MediaCodecInfo;
/// <reference path="./android.media.MediaCodecInfo.d.ts" />
/// <reference path="./android.media.MediaFormat.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module compat {
				export class MediaCodecListCompat {
					public static REGULAR_CODECS: number;
					public static ALL_CODECS: number;
					public getCodecInfos(): native.Array<androidmediaMediaCodecInfo>;
					public findDecoderForFormat(param0: androidmediaMediaFormat): string;
					public findEncoderForFormat(param0: androidmediaMediaFormat): string;
					public constructor(param0: number);
				}
				export module MediaCodecListCompat {
					export class MediaCodecInfoIterator {
						public next(): androidmediaMediaCodecInfo;
						public hasNext(): boolean;
						public remove(): void;
					}
				}
			}
		}
	}
}

/// <reference path="./android.media.MediaCodec.d.ts" />
/// <reference path="./android.media.MediaFormat.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module engine {
				export class AudioChannel {
					public static BUFFER_INDEX_END_OF_STREAM: number;
					public constructor(param0: androidmediaMediaCodec, param1: androidmediaMediaCodec, param2: androidmediaMediaFormat);
					public drainDecoderBufferAndQueue(param0: number, param1: number): void;
					public setActualDecodedFormat(param0: androidmediaMediaFormat): void;
					public feedEncoder(param0: number): boolean;
				}
				export module AudioChannel {
					export class AudioBuffer {
					}
				}
			}
		}
	}
}

import javanioShortBuffer = java.nio.ShortBuffer;
/// <reference path="./java.nio.ShortBuffer.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module engine {
				export class AudioRemixer {
					/**
					 * Constructs a new instance of the net.ypresto.androidtranscoder.engine.AudioRemixer interface with the provided implementation.
					 */
					public constructor(implementation: {
						remix(param0: javanioShortBuffer, param1: javanioShortBuffer): void;
						<clinit>(): void;
					});
					public static DOWNMIX: net.ypresto.androidtranscoder.engine.AudioRemixer;
					public static PASSTHROUGH: net.ypresto.androidtranscoder.engine.AudioRemixer;
					public static UPMIX: net.ypresto.androidtranscoder.engine.AudioRemixer;
					public remix(param0: javanioShortBuffer, param1: javanioShortBuffer): void;
				}
			}
		}
	}
}

import androidmediaMediaExtractor = android.media.MediaExtractor;
/// <reference path="./android.media.MediaExtractor.d.ts" />
/// <reference path="./android.media.MediaFormat.d.ts" />
/// <reference path="./net.ypresto.androidtranscoder.engine.QueuedMuxer.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module engine {
				export class AudioTrackTranscoder {
					public isFinished(): boolean;
					public setup(): void;
					public getWrittenPresentationTimeUs(): number;
					public constructor(param0: androidmediaMediaExtractor, param1: number, param2: androidmediaMediaFormat, param3: net.ypresto.androidtranscoder.engine.QueuedMuxer);
					public stepPipeline(): boolean;
					public release(): void;
					public getDeterminedFormat(): androidmediaMediaFormat;
				}
			}
		}
	}
}

import androidviewSurface = android.view.Surface;
/// <reference path="./android.view.Surface.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module engine {
				export class InputSurface {
					public constructor(param0: androidviewSurface);
					public swapBuffers(): boolean;
					public getSurface(): androidviewSurface;
					public getHeight(): number;
					public makeCurrent(): void;
					public makeUnCurrent(): void;
					public getWidth(): number;
					public release(): void;
					public setPresentationTime(param0: number): void;
				}
			}
		}
	}
}

/// <reference path="./java.lang.String.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module engine {
				export class InvalidOutputFormatException {
					public constructor(param0: string);
				}
			}
		}
	}
}

/// <reference path="./android.media.MediaFormat.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module engine {
				export class MediaFormatValidator {
					public static validateVideoOutputFormat(param0: androidmediaMediaFormat): void;
					public static validateAudioOutputFormat(param0: androidmediaMediaFormat): void;
				}
			}
		}
	}
}

/// <reference path="./java.io.FileDescriptor.d.ts" />
/// <reference path="./java.lang.String.d.ts" />
/// <reference path="./net.ypresto.androidtranscoder.format.MediaFormatStrategy.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module engine {
				export class MediaTranscoderEngine {
					public getProgress(): number;
					public transcodeVideo(param0: string, param1: net.ypresto.androidtranscoder.format.MediaFormatStrategy): void;
					public constructor();
					public setDataSource(param0: javaioFileDescriptor): void;
					public getProgressCallback(): net.ypresto.androidtranscoder.engine.MediaTranscoderEngine.ProgressCallback;
					public setProgressCallback(param0: net.ypresto.androidtranscoder.engine.MediaTranscoderEngine.ProgressCallback): void;
				}
				export module MediaTranscoderEngine {
					export class ProgressCallback {
						/**
						 * Constructs a new instance of the net.ypresto.androidtranscoder.engine.MediaTranscoderEngine$ProgressCallback interface with the provided implementation.
						 */
						public constructor(implementation: {
							onProgress(param0: number): void;
						});
						public onProgress(param0: number): void;
					}
				}
			}
		}
	}
}

import androidgraphicsSurfaceTexture = android.graphics.SurfaceTexture;
/// <reference path="./android.graphics.SurfaceTexture.d.ts" />
/// <reference path="./android.view.Surface.d.ts" />
/// <reference path="./java.lang.String.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module engine {
				export class OutputSurface {
					public getSurface(): androidviewSurface;
					public changeFragmentShader(param0: string): void;
					public checkForNewImage(param0: number): boolean;
					public constructor();
					public makeCurrent(): void;
					public awaitNewImage(): void;
					public release(): void;
					public onFrameAvailable(param0: androidgraphicsSurfaceTexture): void;
					public drawImage(): void;
					public constructor(param0: number, param1: number);
				}
			}
		}
	}
}

/// <reference path="./android.media.MediaExtractor.d.ts" />
/// <reference path="./android.media.MediaFormat.d.ts" />
/// <reference path="./net.ypresto.androidtranscoder.engine.QueuedMuxer.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module engine {
				export class PassThroughTrackTranscoder {
					public isFinished(): boolean;
					public constructor(param0: androidmediaMediaExtractor, param1: number, param2: net.ypresto.androidtranscoder.engine.QueuedMuxer, param3: net.ypresto.androidtranscoder.engine.QueuedMuxer.SampleType);
					public setup(): void;
					public getWrittenPresentationTimeUs(): number;
					public stepPipeline(): boolean;
					public release(): void;
					public getDeterminedFormat(): androidmediaMediaFormat;
				}
			}
		}
	}
}

import androidmediaMediaCodecBufferInfo = android.media.MediaCodec.BufferInfo;
/// <reference path="./android.media.MediaFormat.d.ts" />
/// <reference path="./android.media.MediaMuxer.d.ts" />
/// <reference path="./java.lang.String.d.ts" />
/// <reference path="./java.nio.ByteBuffer.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module engine {
				export class QueuedMuxer {
					public writeSampleData(param0: net.ypresto.androidtranscoder.engine.QueuedMuxer.SampleType, param1: javanioByteBuffer, param2: androidmediaMediaCodecBufferInfo): void;
					public setOutputFormat(param0: net.ypresto.androidtranscoder.engine.QueuedMuxer.SampleType, param1: androidmediaMediaFormat): void;
					public constructor(param0: any, param1: net.ypresto.androidtranscoder.engine.QueuedMuxer.Listener);
				}
				export module QueuedMuxer {
					export class Listener {
						/**
						 * Constructs a new instance of the net.ypresto.androidtranscoder.engine.QueuedMuxer$Listener interface with the provided implementation.
						 */
						public constructor(implementation: {
							onDetermineOutputFormat(): void;
						});
						public onDetermineOutputFormat(): void;
					}
					export class SampleInfo {
					}
					export class SampleType {
						public static VIDEO: net.ypresto.androidtranscoder.engine.QueuedMuxer.SampleType;
						public static AUDIO: net.ypresto.androidtranscoder.engine.QueuedMuxer.SampleType;
						public static valueOf(param0: string): net.ypresto.androidtranscoder.engine.QueuedMuxer.SampleType;
						public static values(): native.Array<net.ypresto.androidtranscoder.engine.QueuedMuxer.SampleType>;
					}
				}
			}
		}
	}
}

/// <reference path="./android.graphics.SurfaceTexture.d.ts" />
/// <reference path="./java.lang.String.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module engine {
				export class TextureRender {
					public static saveFrame(param0: string, param1: number, param2: number): void;
					public changeFragmentShader(param0: string): void;
					public surfaceCreated(): void;
					public constructor();
					public getTextureId(): number;
					public checkGlError(param0: string): void;
					public drawFrame(param0: androidgraphicsSurfaceTexture): void;
				}
			}
		}
	}
}

/// <reference path="./android.media.MediaFormat.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module engine {
				export class TrackTranscoder {
					/**
					 * Constructs a new instance of the net.ypresto.androidtranscoder.engine.TrackTranscoder interface with the provided implementation.
					 */
					public constructor(implementation: {
						setup(): void;
						getDeterminedFormat(): androidmediaMediaFormat;
						stepPipeline(): boolean;
						getWrittenPresentationTimeUs(): number;
						isFinished(): boolean;
						release(): void;
					});
					public isFinished(): boolean;
					public setup(): void;
					public getWrittenPresentationTimeUs(): number;
					public stepPipeline(): boolean;
					public release(): void;
					public getDeterminedFormat(): androidmediaMediaFormat;
				}
			}
		}
	}
}

/// <reference path="./android.media.MediaExtractor.d.ts" />
/// <reference path="./android.media.MediaFormat.d.ts" />
/// <reference path="./net.ypresto.androidtranscoder.engine.QueuedMuxer.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module engine {
				export class VideoTrackTranscoder {
					public isFinished(): boolean;
					public setup(): void;
					public getWrittenPresentationTimeUs(): number;
					public constructor(param0: androidmediaMediaExtractor, param1: number, param2: androidmediaMediaFormat, param3: net.ypresto.androidtranscoder.engine.QueuedMuxer);
					public stepPipeline(): boolean;
					public release(): void;
					public getDeterminedFormat(): androidmediaMediaFormat;
				}
			}
		}
	}
}

/// <reference path="./android.media.MediaFormat.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module format {
				export class Android16By9FormatStrategy {
					public static AUDIO_BITRATE_AS_IS: number;
					public static AUDIO_CHANNELS_AS_IS: number;
					public static SCALE_720P: number;
					public constructor(param0: number, param1: number, param2: number, param3: number);
					public createVideoOutputFormat(param0: androidmediaMediaFormat): androidmediaMediaFormat;
					public createAudioOutputFormat(param0: androidmediaMediaFormat): androidmediaMediaFormat;
					public constructor(param0: number, param1: number);
				}
			}
		}
	}
}

/// <reference path="./android.media.MediaFormat.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module format {
				export class Android720pFormatStrategy {
					public static AUDIO_BITRATE_AS_IS: number;
					public static AUDIO_CHANNELS_AS_IS: number;
					public constructor();
					public constructor(param0: number, param1: number, param2: number);
					public createVideoOutputFormat(param0: androidmediaMediaFormat): androidmediaMediaFormat;
					public createAudioOutputFormat(param0: androidmediaMediaFormat): androidmediaMediaFormat;
					public constructor(param0: number);
				}
			}
		}
	}
}

/// <reference path="./android.media.MediaFormat.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module format {
				export class ExportPreset960x540Strategy {
					public createVideoOutputFormat(param0: androidmediaMediaFormat): androidmediaMediaFormat;
					public createAudioOutputFormat(param0: androidmediaMediaFormat): androidmediaMediaFormat;
				}
			}
		}
	}
}

declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module format {
				export class MediaFormatExtraConstants {
					public static KEY_PROFILE: string;
					public static KEY_LEVEL: string;
					public static KEY_AVC_SPS: string;
					public static KEY_AVC_PPS: string;
					public static KEY_ROTATION_DEGREES: string;
					public static MIMETYPE_VIDEO_AVC: string;
					public static MIMETYPE_VIDEO_H263: string;
					public static MIMETYPE_VIDEO_VP8: string;
					public static MIMETYPE_AUDIO_AAC: string;
				}
			}
		}
	}
}

/// <reference path="./android.media.MediaFormat.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module format {
				export class MediaFormatPresets {
					public static getExportPreset960x540(param0: number, param1: number): androidmediaMediaFormat;
					public static getExportPreset960x540(): androidmediaMediaFormat;
				}
			}
		}
	}
}

/// <reference path="./android.media.MediaFormat.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module format {
				export class MediaFormatStrategy {
					/**
					 * Constructs a new instance of the net.ypresto.androidtranscoder.format.MediaFormatStrategy interface with the provided implementation.
					 */
					public constructor(implementation: {
						createVideoOutputFormat(param0: androidmediaMediaFormat): androidmediaMediaFormat;
						createAudioOutputFormat(param0: androidmediaMediaFormat): androidmediaMediaFormat;
					});
					public createVideoOutputFormat(param0: androidmediaMediaFormat): androidmediaMediaFormat;
					public createAudioOutputFormat(param0: androidmediaMediaFormat): androidmediaMediaFormat;
				}
			}
		}
	}
}

/// <reference path="./net.ypresto.androidtranscoder.format.MediaFormatStrategy.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module format {
				export class MediaFormatStrategyPresets {
					public static AUDIO_BITRATE_AS_IS: number;
					public static AUDIO_CHANNELS_AS_IS: number;
					public static EXPORT_PRESET_960x540: net.ypresto.androidtranscoder.format.MediaFormatStrategy;
					public static createExportPreset960x540Strategy(): net.ypresto.androidtranscoder.format.MediaFormatStrategy;
					public static createAndroid720pStrategy(param0: number): net.ypresto.androidtranscoder.format.MediaFormatStrategy;
					public static createAndroid720pStrategy(param0: number, param1: number, param2: number): net.ypresto.androidtranscoder.format.MediaFormatStrategy;
					public static createAndroid720pStrategy(): net.ypresto.androidtranscoder.format.MediaFormatStrategy;
				}
			}
		}
	}
}

/// <reference path="./java.lang.String.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module format {
				export class OutputFormatUnavailableException {
					public constructor(param0: string);
				}
			}
		}
	}
}

/// <reference path="./android.media.MediaFormat.d.ts" />
/// <reference path="./java.nio.ByteBuffer.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module utils {
				export class AvcCsdUtils {
					public static getSpsBuffer(param0: androidmediaMediaFormat): javanioByteBuffer;
				}
			}
		}
	}
}

/// <reference path="./java.nio.ByteBuffer.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module utils {
				export class AvcSpsUtils {
					public constructor();
					public static getProfileIdc(param0: javanioByteBuffer): number;
				}
			}
		}
	}
}

/// <reference path="./android.media.MediaExtractor.d.ts" />
/// <reference path="./android.media.MediaFormat.d.ts" />
declare module net {
	export module ypresto {
		export module androidtranscoder {
			export module utils {
				export class MediaExtractorUtils {
					public static getFirstVideoAndAudioTrack(param0: androidmediaMediaExtractor): net.ypresto.androidtranscoder.utils.MediaExtractorUtils.TrackResult;
				}
				export module MediaExtractorUtils {
					export class TrackResult {
						public mVideoTrackIndex: number;
						public mVideoTrackMime: string;
						public mVideoTrackFormat: androidmediaMediaFormat;
						public mAudioTrackIndex: number;
						public mAudioTrackMime: string;
						public mAudioTrackFormat: androidmediaMediaFormat;
					}
				}
			}
		}
	}
}

