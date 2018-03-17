import { Observable, EventData } from 'tns-core-modules/data/observable';
import * as app from 'tns-core-modules/application';
import { ObservableProperty } from './decorators';

export enum TranscoderVideoCodec {
  /**
   * Try to use the better codec available on the device
   * In priority order:
   * - HEVC (h265)
   * - H264
   */
  Auto = 'AUTO',

  /**
   * h264
   * also known as MPEG-4 AVC or MPEG-4 part 10
   */
  H264 = 'H264',

  /**
   * h265
   * also known as MPEG4 HEVC codec
   */
  H265 = 'H265',

  /**
   * mp4v
   * also known as MPEG4 part 2 codec
   */
  // MP4V = 'MP4V',

  /**
   * h263
   * also known as 3gpp
   * mainly used for low connections
   */
  // H263 = 'H263',

  // VP8 = 'VP8',
  // VP9 = 'VP9',
}

export enum TranscoderAudioCodec {
  // Auto = 'AUTO',
  Aac = 'AAC',
  // Amr = 'AMR',
  // AmrWb = 'AMR-WB',
  // Mpeg = 'MPEG',
  // Vorbis = 'VORBIS',
  // G711A = 'G771-ALAW',
  // G711M = 'G77-MLAW',
}

export enum TranscoderStatus {
  Idle = 'IDLE',
  Transcoding = 'TRANSCODING',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Canceled = 'CANCELED',
}

export enum TranscoderEventList {
  Canceled = 'canceled',
  Completed = 'completed',
  Failed = 'failed',
  Progress = 'progress',
}

export enum TranscoderNativeTranscoder {
  // Auto = 'AUTO',
  Hardware = 'HARDWARE',
  // Ffmpeg = 'FFMPEG',
}

export interface TranscoderOptions {
  /**
   * Adjust video bitrate, default to null (keep bitrate)
   * @type {number}
   * @memberof TranscoderOptions
   */
  videoBitrate?: number;

  /**
   * Adjust audio bitrate, default to null (keep bitrate)
   * @type {number}
   * @memberof TranscoderOptions
   */
  audioBitrate?: number;

  /**
   * Define the video codec to use
   * default to TranscoderVideoCodec.Auto
   * @type {TranscoderVideoCodec}
   * @memberof TranscoderOptions
   */
  videoCodec?: TranscoderVideoCodec;

  /**
   * Define the audio codec to use
   * default to TranscoderAudioCodec.Auto
   * @type {TranscoderAudioCodec}
   * @memberof TranscoderOptions
   */
  audioCodec?: TranscoderAudioCodec;

  /**
   * Define which native transcoder to use
   * Hardware is faster and better but FFMPEG is not dependant of what the device can or can not do.
   * The hardware transcoder can always handle video taken by the device camera.
   * Prefered choice is Hardware, but choose FFMPEG if video comes from unknown sources
   * default to TranscoderNativeTranscoder.Hardware
   * @type {TranscoderNativeTranscoder}
   * @memberof TranscoderOptions
   */
  nativeTranscoder?: TranscoderNativeTranscoder;

  /**
   * Define the output resolution of the video
   *
   * Positive number represent a constraint on the smaller side of the video
   * Negative number represent a constraint on the larger side of the video
   *
   * Important: the video will never be scalled up !
   *
   * Default or null to not resize the video
   *
   * Ex:
   * - input: 1920x1080, resolutionConstraint: 720, output: 1280x720
   * - input: 1920x1080, resolutionConstraint: -720, output: 720x405
   * @type {number}
   * @memberof TranscoderOptions
   */
  resolutionConstraint?: number;
}

export interface TranscoderResult {
  filePath: string;
}

export enum TranscoderExceptionType {
  /** User canceled exception */
  Canceled = 'CANCELED',

  /** Generic failure error */
  Failed = 'FAILED',

  /** Generic error when Input can not be transcoded */
  InvalidInputFormat = 'INVALID_INPUT',

  /** Happens when output resolution is not correct (like floating number) */
  InvalidOutputResolution = 'INVALID_OUTPUT_RESOLUTION',

  /** Happens when no video codec correspond on the device */
  InvalidOutputVideoCodec = 'INVALID_OUTPUT_VIDEO_CODEC',

  /** Happens when at the end, the device is not capable to hardware transcode a given format */
  InvalidOutputFormat = 'INVALID_OUTPUT_FORMAT',
}

export class TranscoderException extends Error {
  public type: TranscoderExceptionType;
  public nativeError: any;

  constructor(type: TranscoderExceptionType, message: string, nativeError?: any) {
    super(message);
    this.type = type;
    this.nativeError = nativeError;
    Object.setPrototypeOf(this, TranscoderException.prototype);
  }
}

export abstract class TranscoderCommon extends Observable {
  /**
   * Progress of the transcoding, null if not applicable
   * @type {number}
   * @memberof TranscoderCommon
   */
  @ObservableProperty
  public progress: number = null;

  /**
   * Status of the transcoding process
   * @type {TranscoderStatus}
   * @memberof TranscoderCommon
   */
  @ObservableProperty
  public status: TranscoderStatus = TranscoderStatus.Idle;

  /**
   * FilePath of file which will be transcoded.
   * @type {string}
   * @readonly
   * @memberof TranscoderCommon
   */
  public readonly filePath: string;

  /**
   * Store options used by the transcoder
   *
   * @protected
   * @type {TranscoderOptions}
   * @memberof TranscoderCommon
   */
  protected options: TranscoderOptions;

  /**
   * Creates an instance of TranscoderCommon.
   *
   * @param {string} filePath Filepath of video to transcode
   * @param {TranscoderOptions} [options={}]
   * @memberof TranscoderCommon
   */
  constructor(filePath: string, options: TranscoderOptions = {}) {
    super();
    this.filePath = filePath;
    this.options = Object.assign({
      videoBitrate: null,
      audioBitrate: null,
      videoCodec: TranscoderVideoCodec.Auto,
      audioCodec: TranscoderAudioCodec.Aac,
      nativeTranscoder: TranscoderNativeTranscoder.Hardware,
      resolutionConstraint: null,
    });
  }

  /**
   * Get the audio bitrate for the output
   *
   * @type {number}
   * @memberof TranscoderCommon
   */
  public get audioBitrate(): number {
    return this.options.audioBitrate;
  }

  /**
   * Set the audio bitrate for the output
   *
   * @memberof TranscoderCommon
   */
  public set audioBitrate(bitrate: number) {
    if (this.status !== TranscoderStatus.Idle) {
      throw new Error('Can not change bitrate while transcoding.');
    }
    this.options.audioBitrate = bitrate;
  }

  /**
   * Get the video bitrate for the output
   *
   * @type {number}
   * @memberof TranscoderCommon
   */
  public get videoBitrate(): number {
    return this.options.videoBitrate;
  }

  /**
   * Set the video bitrate for the output
   *
   * @memberof TranscoderCommon
   */
  public set videoBitrate(bitrate: number) {
    if (this.status !== TranscoderStatus.Idle) {
      throw new Error('Can not change bitrate while transcoding.');
    }
    this.options.videoBitrate = bitrate;
  }

  /**
   * Launch the transcoding
   *
   * @returns {Promise<TranscoderResult>}
   * @memberof TranscoderCommon
   */
  public transcode(): Promise<TranscoderResult> {
    if (this.status !== TranscoderStatus.Idle) {
      throw new Error('Transcode has already been called');
    }
    this.status = TranscoderStatus.Transcoding;
    return this._transcode();
  }

  /**
   * Force cancel of the thread running the task
   *
   * @memberof TranscoderCommon
   */
  public cancel (): void {
    this.status = TranscoderStatus.Canceled;
  }

  /**
   * Transcoding logic
   *
   * @protected
   * @returns {Promise<TranscoderResult>}
   * @memberof TranscoderCommon
   */
  protected _transcode(): Promise<TranscoderResult> {
    return Promise.reject(null);
  }
}
