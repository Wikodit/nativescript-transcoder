import { Observable } from 'tns-core-modules/data/observable';
import { Transcoder } from 'nativescript-transcoder';

export class HelloWorldModel extends Observable {
  public message: string;
  private transcoder: Transcoder;

  constructor() {
    super();

    this.transcoder = new Transcoder();
    this.message = this.transcoder.message;
  }
}
