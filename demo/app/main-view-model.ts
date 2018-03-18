import { Observable, PropertyChangeData } from 'tns-core-modules/data/observable';
import { Transcoder, TranscoderEventList, TranscoderException } from 'nativescript-transcoder';
import { VideoRecorder } from 'nativescript-videorecorder';
import { Video } from 'nativescript-videoplayer';
import { alert } from 'tns-core-modules/ui/dialogs';
import { ObservableProperty } from 'nativescript-transcoder/decorators';
import { getString, setString } from 'tns-core-modules/application-settings';
// import MediaCodecInfo = android.media.MediaCodecInfo;

export class MainViewModel extends Observable {
  @ObservableProperty
  public error: string = '';

  @ObservableProperty
  public rawFilePath: string = getString('rawFilePath');

  @ObservableProperty
  public transcodedFilePath: string = getString('transcodedFilePath');

  public videoPlayer: Video;
  private transcoder: Transcoder = null;

  constructor() {
    super();
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
      setString('rawFilePath', file);
    }).catch((err) => {
      this.error = err.event || err.message || 'An error occured';
    });
  }

  transcode() {
    if (!this.rawFilePath) {
      alert('No sample file to read');
      return;
    }

    const transcoder = new Transcoder(this.rawFilePath, {
      videoBitrate: 100 * 1000, // 100kbps
      resolutionConstraint: 480,
    });

    transcoder.addEventListener(Observable.propertyChangeEvent, (pcd: PropertyChangeData) => {
      if (pcd.propertyName === 'progress' && pcd.value) {
        this.set('progress', `${Math.round(pcd.value * 100)}%`);
        return;
      }
      this.set(pcd.propertyName, pcd.value);
    });

    transcoder.transcode().then(({ filePath }) => {
      this.transcodedFilePath = filePath;
      setString('transcodedFilePath', filePath);
    }).catch((err: TranscoderException) => {
      this.error = `${err.type} - ${err.message}`;
    });
  }
}