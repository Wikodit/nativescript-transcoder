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
import { Observable } from 'tns-core-modules/ui/page/page';
import OutputFormatUnavailableException = net.ypresto.androidtranscoder.format.OutputFormatUnavailableException;

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

// export const FALLBACK_BITRATE = 1000 * 1000; // 1mbps

export class Transcoder extends TranscoderCommon {
  private _rawUri: Uri;
  private _transcodedFile: File;
  private _future: java.util.concurrent.Future<void>;
  private _codecsCapabilities: { [codecType: string]: MediaCodecInfo.CodecCapabilities } = {};

  public set filePath (filePath) {
    this._rawUri = Uri.fromFile(new File(filePath));
  }

  public _transcode () {
    this._loadHardwareEncoderCodecs();

    const context: Context = app.android.foregroundActivity;
    const resolver = context.getContentResolver();
    const parcelFileDescriptor = resolver.openFileDescriptor(this._rawUri, 'r');
    const fileDescriptor = parcelFileDescriptor.getFileDescriptor();

    const path = context.getExternalFilesDir(null);
    this._transcodedFile = File.createTempFile(`videoTranscoded`, '.mp4', path);

    const outputFilePath = this._transcodedFile.getAbsolutePath();

    let listener;
    let rejectError;
    const listenerPromise = new Promise<TranscoderResult>((resolve, reject) => {
      rejectError = (exception) => {
        if (this.error) return;
        this.status = TranscoderStatus.Failed;
        this.progress = null;

        const msg = exception.getLocalizedMessage
          ? exception.getLocalizedMessage()
          : exception.getMessage
            ? exception.getMessage()
            : (<any>exception).message || 'unknown error';

        const err = new TranscoderException(TranscoderExceptionType.Failed, msg, exception);

        this.notify({ eventName: TranscoderEventList.Failed, object: this, err });
        reject(err);
        this.error = err;
      };

      listener = new MediaTranscoder.Listener({
        onTranscodeCompleted: () => {
          this.status = TranscoderStatus.Completed;
          this.progress = null;
          this.notify({ eventName: TranscoderEventList.Completed, object: this });
          resolve({ filePath: outputFilePath });
        },
        onTranscodeCanceled: () => {
          this.status = TranscoderStatus.Canceled;
          this.progress = null;
          this.notify({ eventName: TranscoderEventList.Canceled, object: this });
          reject(new TranscoderException(
            TranscoderExceptionType.Canceled,
            'User has canceled the transcoding'
          ));
        },
        onTranscodeFailed: rejectError,
        onTranscodeProgress: (progress) => {
          console.log(`Progress: ${progress}`);
          this.status = TranscoderStatus.Transcoding;
          this.progress = progress;
          this.notify({ eventName: TranscoderEventList.Progress, object: this });
        },
      });
    });

    MediaTranscoder.getInstance().transcodeVideo(
      fileDescriptor,
      this._transcodedFile.getAbsolutePath(),
      this._getStrategy((err: any) => {
        rejectError(err);
        return null;
      }),
      listener,
    );

    return listenerPromise;
  }

  public cancel () {
    this._future.cancel(true);
    super.cancel();
  }

  protected _loadHardwareEncoderCodecs() {
    const codecCount = MediaCodecList.getCodecCount();
    for (let i = 0; i < codecCount; i++) {
      const codecInfo = MediaCodecList.getCodecInfoAt(i);
      if (!codecInfo.isEncoder()) continue;
      const types = codecInfo.getSupportedTypes();
      const typeLength = types.length;
      for (let j = 0; j < typeLength; j++) {
        this._codecsCapabilities[types[j]] = codecInfo.getCapabilitiesForType(types[j]);
      }
    }
  }

  protected _getStrategy(reject): MediaFormatStrategy {
    const self = this;
    return new MediaFormatStrategy({
      /**
       * Return the video output format to give to the hardware transcoder
       *
       * @param {MediaFormat} inputFormat
       * @returns {MediaFormat}
       * @memberof Transcoder
       */
      createVideoOutputFormat(inputFormat: MediaFormat): MediaFormat {
        if (self.error) return null;
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
        const inputType = inputFormat.getString(KEY_MIME);

        let inputBitrate;
        // Optional information, may not be always here on H264
        if (inputFormat.containsKey(KEY_BIT_RATE)) {
          inputBitrate = inputFormat.getInteger(KEY_BIT_RATE);
        }

        // const inputFrameRate = inputFormat.getInteger(KEY_FRAME_RATE);

        let outputType;
        let outputHeight;
        let outputWidth;
        let outputBitrate = self.options.videoBitrate || inputBitrate;

        /**
         * Handle the ouptput Type
         */
        if (self.options.videoCodec !== TranscoderVideoCodec.Auto) {
          outputType = MediaVideoMimetype[self.options.videoCodec];
        } else {
          for (const mimeAuto of MediaVideoMimetypeAuto) {
            const type = MediaVideoMimetype[mimeAuto];
            if (self._codecsCapabilities[type]) {
              outputType = type;
              break;
            }
          }
        }

        if (!self._codecsCapabilities[outputType]) {
          return reject(new TranscoderException(
            TranscoderExceptionType.InvalidOutputVideoCodec,
            `Codec for ${outputType} is not available on this device`,
          ));
        }

        /**
         * Handle the ouptput Size
         */
        if (!self.options.resolutionConstraint) {
          outputWidth = inputWidth;
          outputHeight = inputHeight;
        } else {
          // constraint on small side and small Side is Height
          // OR constraint on large side and largeSide is Height
          if (inputWidth >= inputHeight === self.options.resolutionConstraint > 0) {
            outputHeight = self.options.resolutionConstraint;
            outputWidth = inputWidth * self.options.resolutionConstraint / outputHeight;
          } else {
            outputWidth = self.options.resolutionConstraint;
            outputHeight = inputHeight * self.options.resolutionConstraint / outputWidth;
          }
        }

        if (outputWidth % 1 !== 0 || outputHeight % 1 !== 0) {
          return reject(new TranscoderException(
            TranscoderExceptionType.InvalidOutputResolution,
            `This video will generate an invalid resolution output. (${outputWidth}x${outputHeight})`,
          ));
        }


        /**
         * Maybe we don't need to transcode at all!
         */
        if (outputWidth >= inputWidth && outputBitrate >= inputBitrate && outputType === inputType) {
          console.log(`The video doesn't need encoding (skip). (${outputWidth}x${outputHeight})`);
          return null;
        }

        /**
         * Finaly, create the format
         */
        const format = MediaFormat.createVideoFormat(outputType, inputWidth, inputHeight);

        format.setInteger(KEY_BIT_RATE, outputBitrate || 1000 * 1000);
        format.setInteger(KEY_I_FRAME_INTERVAL, 3);
        format.setInteger(
          KEY_COLOR_FORMAT,
          (<any>MediaCodecInfo.CodecCapabilities).COLOR_FormatSurface,
        );

        /**
         * We also need to check if the codec can handle this format
         */
        if (!(<any>self._codecsCapabilities[outputType]).isFormatSupported(format)) {
          return reject(new TranscoderException(
            TranscoderExceptionType.InvalidOutputFormat,
            `Unfortunately your device doesn't support transcoding to this format.`,
          ));
        }

        // Lolipop doesn't like isFormatSupported with framerate, so we put it after
        format.setInteger(KEY_FRAME_RATE, 30);

        return format;
      },

      /**
       *  Return the audio output format to give to the hardware transcoder
       *
       * @todo no audio transcoding for now
       * @param {MediaFormat} inputFormat
       * @returns {MediaFormat}
       * @memberof Transcoder
       */
      createAudioOutputFormat(inputFormat: MediaFormat): MediaFormat {
        if (self.error) return null;
        if (!self.options.audioBitrate) return null;

        // Use original sample rate, as resampling is not supported yet.
        const format = MediaFormat.createAudioFormat(
          MediaAudioMimetype.AAC,
          inputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE),
          MediaFormatStrategyPresets.AUDIO_CHANNELS_AS_IS,
        );
        format.setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC);
        format.setInteger(
          MediaFormat.KEY_BIT_RATE,
          self.options.audioBitrate || MediaFormatStrategyPresets.AUDIO_BITRATE_AS_IS
        );
        return format;
      }
    });
  }
}
