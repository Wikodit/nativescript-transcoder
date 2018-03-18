import { Observable, PropertyChangeData } from 'tns-core-modules/data/observable';
import { Transcoder, TranscoderEventList, TranscoderException } from 'nativescript-transcoder';
import { VideoRecorder } from 'nativescript-videorecorder';
import { Video } from 'nativescript-videoplayer';
import { alert } from 'tns-core-modules/ui/dialogs';
import { ObservableProperty } from 'nativescript-transcoder/decorators';
import { getString, setString } from 'tns-core-modules/application-settings';
import { isAndroid } from 'tns-core-modules/platform';
// import MediaCodecInfo = android.media.MediaCodecInfo;

enum FSScale {
  Byte = 0,
  KiloByte = 1,
  MegaByte = 2,
  GigaByte = 3,
  TeraByte = 4,
  PetaByte = 5,
}

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

    this.addEventListener(Observable.propertyChangeEvent, (
      { propertyName, value }: PropertyChangeData
    ) => {
      if ((propertyName === 'rawFilePath' || propertyName === 'transcodedFilePath') && value) {
        const fileSize = Math.round(this.getFileSize(value, FSScale.MegaByte) * 100) / 100;
        this.set(`${propertyName.replace('Path', '')}Size`, `${fileSize} MB`);
        return;
      }
    });

    this.rawFilePath = getString('rawFilePath');
    this.transcodedFilePath = getString('transcodedFilePath');
  }

  getFileSize(path, scale: FSScale) {
    if (isAndroid) {
      const file = new java.io.File(path);
      return file.length() / Math.pow(1024, scale);
    }
    else {
      const fileAttributes = NSFileManager.defaultManager.attributesOfItemAtPathError(path);
      return fileAttributes.objectForKey(NSFileSize) / Math.pow(1000, scale);
    }
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
      videoBitrate: 1000 * 1000, // 1mbps
      resolutionConstraint: 720,
    });

    transcoder.addEventListener(Observable.propertyChangeEvent, (
      { propertyName, value }: PropertyChangeData
    ) => {
      if (propertyName === 'progress' && value) {
        this.set('progress', `${Math.round(value * 100)}%`);
        return;
      }
      this.set(propertyName, value);
    });

    transcoder.transcode().then(({ filePath }) => {
      this.transcodedFilePath = filePath;
      setString('transcodedFilePath', filePath);
    }).catch((err: TranscoderException) => {
      this.error = `${err.type} - ${err.message}`;
    });
  }
}