# nativescript-transcoder

**WARNING, WORK IN PROGRESS, v1.0 excepted end of March**

This plugins for nativescript brings video transcoding support.

* Hardware transcoding on android through [android-transcoder](https://github.com/ypresto/android-transcoder).
* **@todo** Hardware transcoding on iOS through AVFoundation
* **@todo** Software transcoding on iOS/Android through FFMpeg

The plugins support observing events as well as promises.

**Only AAC audio is supported right now on Android, simulator camera is using 3GPP audio, so you can not test it with the simulator**

## Installation

```bash
tns plugin add nativescript-transcoder
```

## Usage 

### JavaScript

```javascript
const {
  Transcoder,
  TranscoderVideoCodec,
  TranscoderEventList,
} = require('nativescript-transcoder');

const transcoder = new Transcoder(inputFilePath, {
  videoBitrate: 1000 * 1000, // 1mbps
  resolutionConstraint: 720,
  videoCodec: TranscoderVideoCodec.H264,
});

transcoder.transcode().then(({ filePath }) => {
  console.log(`Output file path: ${filePath}`);
}).catch((err) => {
  console.log(`Error: ${err.type} - ${err.message}`);
});

transcoder.on(TranscoderEventList.Progress, (progress) => {
  console.log(`Progress: ${progress}`);
})
```

### TypeScript

```typescript
import {
  Transcoder,
  TranscoderVideoCodec,
} from 'nativescript-transcoder';

const transcoder = new Transcoder(inputFilePath, {
  videoBitrate: 1000 * 1000, // 1mbps
  resolutionConstraint: 720,
  videoCodec: TranscoderVideoCodec.H264,
});

transcoder.transcode().then(({ filePath }) => {
  console.log(`Output file path: ${filePath}`);
}).catch((err: TranscoderException) => {
  console.log(`Error: ${err.type} - ${err.message}`);
});

transcoder.on(TranscoderEventList.Progress, (progress: number) => {
  console.log(`Progress: ${progress}`);
})
```

## API

### Transcoder

The main class you need to use, a transcoder can only be used for one transcoding.

#### Constructor

#### Methods
    
| Method | Return type | Description |
| --- | --- | --- |
| `constructor(filePath: string, options?: TranscoderOptions)` | `Transcoder` | Initialize a transcoder, filePath is mandatory (input video).
| `transcode()` | `Promise<TranscoderResult>` | Launch the transcoding |
| `cancel()` | `void` | Force cancel of the thread running the task |
    

#### Properties
    
| Property | Default | Description |
| --- | --- | --- |
| **@ObservableProperty** `progress: number` | `null` | Progress of the transcoding, null if not applicable |
| **@ObservableProperty** `status` | `TranscoderStatus.Idle` | Status of the transcoding process |
| **@readonly** `filePath: string` | N/A | FilePath of file which will be transcoded. |
| **@get/@set** `audioBitrate: number` | from options | set/get audio bitrate |
| **@get/@set** `videoBitrate: number` | from options | set/get video bitrate |
    

#### Events

| Name | Callback | Description |
| --- | --- | --- |
| `TranscoderEventList.Completed` or `completed` | `(result: TranscoderResult) => void` | Emitted when the transcoding is done. You can access the output path from `result.filePath`. |
| `TranscoderEventList.Canceled` or `canceled` | `() => void` | The user has canceled the transcoding |
| `TranscoderEventList.Progress` or `progress` | `(progress: number) => void` | Called each time the progress change. |
| `TranscoderEventList.Failed` or `failed` | `(err: TranscoderException) => void` | An error occured while transcoding or attempting to transcode. See [TranscoderException](#TranscoderException) to see how to handle exceptions |
    

### TranscoderOptions

Construct an object to pass as `options` to `new Transcoder(filePath, options)`.

All options are optionals.

    
| Property | Default | Description |
| --- | --- | --- |
| `videoBitrate: number` | `null` | Adjust video bitrate<br>Default to `null`.<br>When `null`, try to use the same bitrate as input, but bitrate information can not always be retrieved on h264 on Android, as a result if encoding is necessary, bitrate will default to 1mbps (1000000). |
| `audioBitrate: number` | `null` | Adjust audio bitrate (in bps), default to null (keep bitrate) |
| `videoCodec: TranscoderVideoCodec` | `TranscoderVideoCodec.Auto` | Define the video codec to use. Be careful, all device does not support all codecs, use `TranscoderVideoCodec.Auto` if not sure. |
| `audioCodec: TranscoderAudioCodec` | `TranscoderVideoCodec.Aac` | Define the audio codec to use. Only AAC supported for now. |
| `nativeTranscoder: TranscoderNativeTranscoder` | `TranscoderNativeTranscoder.Hardware` | Define which native transcoder to use. Hardware is faster and better but FFMPEG is not dependant of what the device can or can not do. The hardware transcoder can always handle video taken by the device camera. Prefered choice is Hardware, but choose FFMPEG if video comes from unknown sources |
| `resolutionConstraint: number` | `null` | Define the output resolution of the video. Positive number represent a constraint on the smaller side of the video. Negative number represent a constraint on the larger side of the video. Important: the video will never be scalled up ! (`null` to keep the original format). Ex: <br>- input: 1920x1080, resolutionConstraint: 720, output: 1280x720<br>- input: 1920x1080, resolutionConstraint: -720, output: 720x405 |
    

### TranscoderException

#### Exemple

```typescript
transcoder.on(TranscoderEventList.Failed, (err: TranscoderException) => {
  switch (err.type) {
    case TranscoderExceptionType.InvalidOutputFormat:
      console.log('The device doesn\'t support the asked output')
      break;
    default: // TranscoderExceptionType.Failed:
      console.log('Unable to trasncode')
      break;
  }
})
```

#### Properties
    
| Property/method | Default | Description |
| --- | --- | --- |
| `type: TranscoderExceptionType` | `null` | Type of transcoding error (see [TranscoderExceptionType](#TranscoderExceptionType)) |
| `nativeError: any` | `undefined` | May be the raw error rejected by the native transcoder. |
| `constructor(type: TranscoderExceptionType, message: string, nativeError?: any): TranscoderException` | N/A | Initialize a TranscoderException, prefered way is to inherit from that. |

### TranscoderExceptionType

An enum containing all possible types

Prefered way is to use `TranscoderExceptionType.Canceled` instead of it's value (`'CANCELED'`).

    
| Key | Value | Description |
| --- | --- | --- |
| `Canceled` | `'CANCELED'` | User canceled exception |
| `Failed` | `'FAILED'` | Generic failure error |
| `InvalidInputFormat` | `'INVALID_INPUT'` | Generic error when Input can not be transcoded. |
| `InvalidOutputResolution` | `'INVALID_INPUT'` | Happens when output resolution is not correct (like floating number). |
| `InvalidOutputVideoCodec` | `'INVALID_OUTPUT_VIDEO_CODEC'` | Happens when no video codec correspond on the device. |
| `InvalidOutputFormat` | `'INVALID_OUTPUT_FORMAT'` | Happens when at the end, the device is not capable to hardware transcode a given format |



## License

Apache License Version 2.0, January 2004
