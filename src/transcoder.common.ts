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

export enum TranscoderExceptionTypeList {
  Canceled = 'CANCELED',
  Failed = 'FAILED',
}

export enum TranscoderNativeTranscoder {
  // Auto = 'AUTO',
  Hardware = 'HARDWARE',
  // Ffmpeg = 'FFMPEG',
}

export interface TranscoderOptions {
  /**
   * Adjust video bitrate, default to 8mbps
   * @type {number}
   * @memberof TranscoderOptions
   */
  videoBitrate?: number;

  /**
   * Adjust audio bitrate, default is to reuse the same
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
}

export interface TranscoderResult {
  filePath: string;
}

export class TranscoderException extends Error {
  public type: TranscoderExceptionTypeList;
  public nativeError: any;

  constructor(type: TranscoderExceptionTypeList, message: string, nativeError?: any) {
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
      bitrate: 8000 * 1000, // 8mbps
      audioBitrate: null,
      videoCodec: TranscoderVideoCodec.Auto,
      audioCodec: TranscoderAudioCodec.Aac,
      nativeTranscoder: TranscoderNativeTranscoder.Hardware,
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
   * Start the transcoding
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
