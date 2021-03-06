import { Observable } from "tns-core-modules/ui/page/page";
import { TranscoderException } from ".";

export function ObservableProperty (target: Observable, propertyKey: string) {
  Object.defineProperty(target, propertyKey, {
    get: function () {
      return this[`_${propertyKey}`];
    },
    set: function (value) {
      if (this[`_${propertyKey}`] === value) {
        return;
      }

      this[`_${propertyKey}`] = value;
      this.notify({
        eventName: Observable.propertyChangeEvent,
        propertyName: propertyKey,
        object: this,
        value,
      });
    },
    enumerable: true,
    configurable: true
  });
}
