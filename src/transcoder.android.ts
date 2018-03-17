/* NS imports */
import {
  TranscoderCommon,
  TranscoderStatus,
  TranscoderException,
  TranscoderExceptionTypeList,
  TranscoderResult,
  TranscoderEventList,
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
import OutputFormatUnavailableException = net.ypresto.androidtranscoder.format.OutputFormatUnavailableException;

export enum MediaVideoMimetype {
  H263 = 'video/3gpp',
  H264 = 'video/avc',
  H265 = 'video/hevc',
  VP8 = 'video/x-vnd.on2.vp8',
  VP9 = 'video/x-vnd.on2.vp9',
  MPEG4 = 'video/mp4v-es',
}

export enum MediaAudioMimetype {
  AAC = 'audio/mp4a-latm',
  Amr = 'audio/3gpp',
  AmrWb = 'audio/amr-wb',
  Mpeg = 'audio/mpeg',
  Vorbis = 'audio/vorbis',
  G711A = 'audio/g711-alaw',
  G711M = 'audio/g711-mlaw',
}

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
    const listenerPromise = new Promise<TranscoderResult>((resolve, reject) => {
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
            TranscoderExceptionTypeList.Canceled,
            'User has canceled the transcoding'
          ));
        },
        onTranscodeFailed: (err) => {
          this.set('status', TranscoderStatus.Failed);
          this.set('progress', null);
          this.notify({ eventName: TranscoderEventList.Failed, object: this });
          reject(new TranscoderException(
            TranscoderExceptionTypeList.Failed,
            err.getLocalizedMessage(),
            err,
          ));
        },
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
      this._buildMediaFormatStrategy(),
      listener,
    );

    return listenerPromise;
  }

  public cancel () {
    this._future.cancel(true);
    super.cancel();
  }

  /**
   * Create a transcoding strategy
   * Used for Hardware transcoding
   *
   * @private
   * @returns {MediaFormatStrategy}
   * @memberof Transcoder
   */
  protected _buildMediaFormatStrategy(): MediaFormatStrategy {
    return {
      createVideoOutputFormat: this._createVideoOutputFormat,
      createAudioOutputFormat: this._createAudioOutputFormat
    };
  }

  /**
   * Return the video output format to give to the hardware transcoder
   *
   * @protected
   * @param {MediaFormat} inputFormat
   * @returns {MediaFormat}
   * @memberof Transcoder
   */
  protected _createVideoOutputFormat(inputFormat: MediaFormat): MediaFormat {
    const bitrate = this.videoBitrate || 8000 * 1000;

    const width = inputFormat.getInteger(MediaFormat.KEY_WIDTH);
    const height = inputFormat.getInteger(MediaFormat.KEY_HEIGHT);
    let longer, shorter, outWidth, outHeight;
    if (width >= height) {
      longer = width;
      shorter = height;
      outWidth = 1280;
      outHeight = 720;
    } else {
      shorter = width;
      longer = height;
      outWidth = 720;
      outHeight = 1280;
    }
    if (longer * 9 !== shorter * 16) {
      throw new OutputFormatUnavailableException("This video is not 16:9, and is not able to transcode. (" + width + "x" + height + ")");
    }
    if (shorter <= 720) {
      console.log("This video is less or equal to 720p, pass-through. (" + width + "x" + height + ")");
      return null;
    }
    const format: MediaFormat = MediaFormat.createVideoFormat("video/avc", outWidth, outHeight);

    format.setInteger(MediaFormat.KEY_BIT_RATE, bitrate);
    format.setInteger(MediaFormat.KEY_FRAME_RATE, 30);
    format.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 3);
    format.setInteger(
      MediaFormat.KEY_COLOR_FORMAT,
      (<any>MediaCodecInfo.CodecCapabilities).COLOR_FormatSurface,
    );
    return format;
  }

  /**
   *  Return the audio output format to give to the hardware transcoder
   *
   * @protected
   * @param {MediaFormat} inputFormat
   * @returns {MediaFormat}
   * @memberof Transcoder
   */
  protected _createAudioOutputFormat(inputFormat: MediaFormat): MediaFormat {
    const bitrate = this.audioBitrate || MediaFormatStrategyPresets.AUDIO_BITRATE_AS_IS;
    const channels = MediaFormatStrategyPresets.AUDIO_CHANNELS_AS_IS;

    if (bitrate === MediaFormatStrategyPresets.AUDIO_BITRATE_AS_IS
      || channels === MediaFormatStrategyPresets.AUDIO_CHANNELS_AS_IS
    ) return null;

    // Use original sample rate, as resampling is not supported yet.
    const format = MediaFormat.createAudioFormat(
      MediaAudioMimetype.AAC,
      inputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE),
      channels,
    );
    format.setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC);
    format.setInteger(MediaFormat.KEY_BIT_RATE, bitrate);
    return format;
  }

  // protected _getHardwareCodec () {
  //   for (let i = 0, l = android.media.MediaCodecList.getCodecCount(); i < l; i++) {
  //     const codecInfo = android.media.MediaCodecList.getCodecInfoAt(i);
  //     if (!codecInfo.isEncoder()) continue;
  //     const name = codecInfo.getName()
  //     const types = codecInfo.getSupportedTypes()
  //     const oTypes = output.types[name] = []
  //     for (let j = 0, m = types.length; j < m; j++) {
  //       oTypes.push(types[j])
  //     }
  //   }
  // }
}