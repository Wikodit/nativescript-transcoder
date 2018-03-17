import { Observable } from 'tns-core-modules/data/observable';
import { Transcoder, TranscoderEventList, TranscoderException } from 'nativescript-transcoder';
import { VideoRecorder } from 'nativescript-videorecorder';
import { Video } from 'nativescript-videoplayer';
import { alert } from 'tns-core-modules/ui/dialogs';
import { ObservableProperty } from 'nativescript-transcoder/decorators';
// import MediaCodecInfo = android.media.MediaCodecInfo;

export class MainViewModel extends Observable {
  @ObservableProperty
  public error: string = '';

  @ObservableProperty
  public rawFilePath: string;

  @ObservableProperty
  public transcodedFilePath: string;

  public videoPlayer: Video;
  private transcoder: Transcoder = null;

  constructor() {
    super();
  }

  test() {
    console.log('tes2t');
    //  (<any>global).MediaCodecInfo = MediaCodecInfo;
    // console.log(0, MediaCodecInfo.CodecCapabilities);
    // console.log(1, (<any>MediaCodecInfo).getCapabilitiesForType("video/hevc").getVideoCapabilities());
    // console.log(2, (<any>MediaCodecInfo).getCapabilitiesForType("video/avc").getVideoCapabilities());
    // console.log(3, (<any>MediaCodecInfo).getCapabilitiesForType("video/hevc").getEncoderCapabilities());
    // console.log(4, (<any>MediaCodecInfo).getCapabilitiesForType("video/avc").getEncoderCapabilities());
  }

  videoPlayerLoaded({ object }: { object: Video }) {
    this.videoPlayer = object;
  }

  playSample() {
    if (!this.rawFilePath) {
      alert('No sample file to read');
      return;
    }
    this.videoPlayer.src = this.rawFilePath;
    setTimeout(() => {
      this.videoPlayer.play();
    }, 500);
  }

  playTranscoded() {
    if (!this.transcodedFilePath) {
      alert('No transcoded file to read');
      return;
    }
    this.videoPlayer.src = this.transcodedFilePath;
    this.videoPlayer.play();
  }

  record() {
    console.log('record');
    this.error = '';
    const vr = new VideoRecorder({ hd: true });

    vr.record().then(({ file }) => {
      this.rawFilePath = file;
      console.log('rawFilePath', file);
    }).catch((err) => {
      this.error = err.event || err.message || 'An error occured';
    });
  }

  transcode() {
    if (!this.rawFilePath) {
      alert('No sample file to read');
      return;
    }

    this.transcoder = new Transcoder(this.rawFilePath, {
      videoBitrate: 1000 * 1000, // 1mbps
    });
    this.transcoder.transcode().then(({ filePath }) => {
      this.transcodedFilePath = filePath;
    }).catch((err: TranscoderException) => {
      this.error = `${err.type} - ${err.message}`;
    });
  }
}