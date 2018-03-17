/* NS imports */
import {
  TranscoderCommon,
  TranscoderStatus,
  TranscoderException,
  TranscoderExceptionType,
  TranscoderResult,
  TranscoderEventList,
  TranscoderOptions,
  TranscoderVideoCodec,
} from './transcoder.common';
import * as app from 'tns-core-modules/application';

/* Java imports */
import File = java.io.File;

/* Android imports */
import Uri = android.net.Uri;
import Context = android.content.Context;
import MediaFormat = android.media.MediaFormat;
import MediaCodecList = android.media.MediaCodecList;
import MediaCodecInfo = android.media.MediaCodecInfo;

/* Android transcoder imports */
import MediaTranscoder = net.ypresto.androidtranscoder.MediaTranscoder;
import MediaFormatStrategyPresets = net.ypresto.androidtranscoder.format.MediaFormatStrategyPresets;
import MediaFormatStrategy = net.ypresto.androidtranscoder.format.MediaFormatStrategy;
import MediaFormatExtraConstants = net.ypresto.androidtranscoder.format.MediaFormatExtraConstants;
import { BindThrowToReject } from './decorators';
// import OutputFormatUnavailableException = net.ypresto.androidtranscoder.format.OutputFormatUnavailableException;

export enum MediaVideoMimetype {
  H263 = 'video/3gpp',
  H264 = 'video/avc',
  H265 = 'video/hevc',
  VP8 = 'video/x-vnd.on2.vp8',
  VP9 = 'video/x-vnd.on2.vp9',
  MPEG4 = 'video/mp4v-es',
}

export const MediaVideoMimetypeAuto = ['H265', 'H264'];

export enum MediaAudioMimetype {
  AAC = 'audio/mp4a-latm',
  Amr = 'audio/3gpp',
  AmrWb = 'audio/amr-wb',
  Mpeg = 'audio/mpeg',
  Vorbis = 'audio/vorbis',
  G711A = 'audio/g711-alaw',
  G711M = 'audio/g711-mlaw',
}

export const MediaAudioMimetypeAuto = ['AAC'];

export class Transcoder extends TranscoderCommon {
  private _rawUri: Uri;
  private _transcodedFile: File;
  private _future: java.util.concurrent.Future<void>;

  public set filePath (filePath) {
    this._rawUri = Uri.fromFile(new File(filePath));
  }

  public _transcode () {
    const context: Context = app.android.foregroundActivity;
    const resolver = context.getContentResolver();
    const parcelFileDescriptor = resolver.openFileDescriptor(this._rawUri, 'r');
    const fileDescriptor = parcelFileDescriptor.getFileDescriptor();

    const path = context.getExternalFilesDir(null);
    this._transcodedFile = File.createTempFile(`videoTranscoded`, '.mp4', path);

    let listener;
    let throwError: (reason?: any) => void;
    const listenerPromise = new Promise<TranscoderResult>((resolve, reject) => {
      // Little hacky, but couldn't figured out how to throw Java exceptions from JS
      // So we need a way to do "manual" exceptions, which could be called from the implementation
      // of AutoMediaFormatStrategy
      throwError = (err) => {
        this.set('status', TranscoderStatus.Failed);
        this.set('progress', null);
        this.notify({ eventName: TranscoderEventList.Failed, object: this });
        reject(new TranscoderException(
          TranscoderExceptionType.Failed,
          err.getLocalizedMessage && err.getLocalizedMessage() || err.message,
          err,
        ));
      };

      listener = new MediaTranscoder.Listener({
        onTranscodeCompleted: () => {
          this.set('status', TranscoderStatus.Completed);
          this.set('progress', null);
          this.notify({ eventName: TranscoderEventList.Completed, object: this });
          resolve();
        },
        onTranscodeCanceled: () => {
          this.set('status', TranscoderStatus.Canceled);
          this.set('progress', null);
          this.notify({ eventName: TranscoderEventList.Canceled, object: this });
          reject(new TranscoderException(
            TranscoderExceptionType.Canceled,
            'User has canceled the transcoding'
          ));
        },
        onTranscodeFailed: throwError,
        onTranscodeProgress: (progress) => {
          this.set('status', TranscoderStatus.Transcoding);
          this.set('progress', progress);
          this.notify({ eventName: TranscoderEventList.Progress, object: this });
        },
      });
    });

    MediaTranscoder.getInstance().transcodeVideo(
      fileDescriptor,
      this._transcodedFile.getAbsolutePath(),
      new AutoMediaFormatStrategy(this.options, throwError),
      listener,
    );

    return listenerPromise;
  }

  public cancel () {
    this._future.cancel(true);
    super.cancel();
  }
}

@Interfaces([MediaFormatStrategy])
export class AutoMediaFormatStrategy extends java.lang.Object {
  static constructorCalled: boolean = false;

  options: TranscoderOptions;

  codecsCapabilities: { [codecType: string]: MediaCodecInfo.CodecCapabilities } = {};

  reject: (reason?: any) => void;
  isRejected: boolean = false;

  constructor(options: TranscoderOptions, reject: (reason?: any) => void) {
    super();

    this.options = options;

    this.reject = (reason?: any) => {
      reject(reason);
      return null;
    };

    this._loadHardwareEncoderCodecs();

    return global.__native(this);
  }

  /**
   * Return the video output format to give to the hardware transcoder
   *
   * @param {MediaFormat} inputFormat
   * @returns {MediaFormat}
   * @memberof Transcoder
   */
  @BindThrowToReject('reject', 'isRejected', null)
  public createVideoOutputFormat(inputFormat: MediaFormat): MediaFormat {
    if (this.isRejected) return null;

    const {
      KEY_WIDTH,
      KEY_HEIGHT,
      KEY_BIT_RATE,
      KEY_FRAME_RATE,
      KEY_I_FRAME_INTERVAL,
      KEY_COLOR_FORMAT,
      KEY_MIME,
    } = MediaFormat;

    const inputWidth = inputFormat.getInteger(KEY_WIDTH);
    const inputHeight = inputFormat.getInteger(KEY_HEIGHT);
    const inputBitrate = inputFormat.getInteger(KEY_BIT_RATE);
    const inputType = inputFormat.getString(KEY_MIME);
    // const inputFrameRate = inputFormat.getInteger(KEY_FRAME_RATE);

    let outputType;
    let outputHeight;
    let outputWidth;
    let outputBitrate = this.options.videoBitrate || inputBitrate;

    /**
     * Handle the ouptput Type
     */
    if (this.options.videoCodec !== TranscoderVideoCodec.Auto) {
      outputType = MediaVideoMimetype[this.options.videoCodec];
    } else {
      for (const mimeAuto of MediaVideoMimetypeAuto) {
        const type = MediaVideoMimetype[mimeAuto];
        if (this.codecsCapabilities[type]) {
          outputType = type;
          break;
        }
      }
    }

    if (!this.codecsCapabilities[outputType]) {
      throw new TranscoderException(
        TranscoderExceptionType.InvalidOutputVideoCodec,
        `Codec for ${outputType} is not available on this device`,
      );
    }

    /**
     * Handle the ouptput Size
     */
    if (!this.options.resolutionConstraint) {
      outputWidth = inputWidth;
      outputHeight = inputHeight;
    } else {
      // constraint on small side and small Side is Height
      // OR constraint on large side and largeSide is Height
      if (inputWidth >= inputHeight === this.options.resolutionConstraint > 0) {
        outputHeight = this.options.resolutionConstraint;
        outputWidth = inputWidth * this.options.resolutionConstraint / outputHeight;
      } else {
        outputWidth = this.options.resolutionConstraint;
        outputHeight = inputHeight * this.options.resolutionConstraint / outputWidth;
      }
    }

    if (outputWidth % 1 !== 0 || outputHeight % 1 !== 0) {
      throw new TranscoderException(
        TranscoderExceptionType.InvalidOutputResolution,
        `This video will generate an invalid resolution output. (${outputWidth}x${outputHeight})`,
      );
    }


    /**
     * Maybe we don't need to transcode at all!
     */
    if (outputWidth >= inputWidth && outputBitrate > inputBitrate && outputType === inputType) {
      console.log(`The video doesn't need encoding (skip). (${outputWidth}x${outputHeight})`);
      return null;
    }

    /**
     * Finaly, create the format
     */
    const format = MediaFormat.createVideoFormat(outputType, inputWidth, inputHeight);

    format.setInteger(KEY_BIT_RATE, outputBitrate);
    format.setInteger(KEY_I_FRAME_INTERVAL, 3);
    format.setInteger(
      KEY_COLOR_FORMAT,
      (<any>MediaCodecInfo.CodecCapabilities).COLOR_FormatSurface,
    );

    /**
     * We also need to check if the codec can handle this format
     */
    if (!(<any>this.codecsCapabilities[outputType]).isFormatSupported(format)) {
      throw new TranscoderException(
        TranscoderExceptionType.InvalidOutputFormat,
        `Unfortunately your device doesn't support transcoding to this format.`,
      );
    }

    // Lolipop doesn't like isFormatSupported with framerate, so we put it after
    format.setInteger(KEY_FRAME_RATE, 30);

    return format;
  }

  /**
   *  Return the audio output format to give to the hardware transcoder
   *
   * @todo no audio transcoding for now
   * @param {MediaFormat} inputFormat
   * @returns {MediaFormat}
   * @memberof Transcoder
   */
  @BindThrowToReject('reject', 'isRejected', null)
  public createAudioOutputFormat(inputFormat: MediaFormat): MediaFormat {
    if (this.isRejected) return null;
    if (!this.options.audioBitrate) return null;

    // Use original sample rate, as resampling is not supported yet.
    const format = MediaFormat.createAudioFormat(
      MediaAudioMimetype.AAC,
      inputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE),
      MediaFormatStrategyPresets.AUDIO_CHANNELS_AS_IS,
    );
    format.setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC);
    format.setInteger(MediaFormat.KEY_BIT_RATE, this.options.audioBitrate);
    return format;
  }

  protected _loadHardwareEncoderCodecs() {
    const codecCount = MediaCodecList.getCodecCount();
    for (let i = 0; i < codecCount; i++) {
      const codecInfo = MediaCodecList.getCodecInfoAt(i);
      if (!codecInfo.isEncoder()) continue;
      const types = codecInfo.getSupportedTypes();
      const typeLength = types.length;
      for (let j = 0; j < typeLength; j++) {
        this.codecsCapabilities[types[j]] = codecInfo.getCapabilitiesForType(types[j]);
      }
    }
  }
}