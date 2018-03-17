import * as observable from 'tns-core-modules/data/observable';
import * as pages from 'tns-core-modules/ui/page';
import { MainViewModel } from './main-view-model';
import { Video } from 'nativescript-videoplayer';

const vm = new MainViewModel();

export function pageLoaded(args: observable.EventData) {
  let page = <pages.Page>args.object;
  page.bindingContext = vm;

  vm.videoPlayer = <Video><any>page.getViewById('videoPlayer');
}