import { Observable } from "tns-core-modules/ui/page/page";
import { TranscoderException } from ".";

export function ObservableProperty (target: Observable, propertyKey: string) {
  Object.defineProperty(target, propertyKey, {
    get: function () {
      return this['_' + propertyKey];
    },
    set: function (value) {
      if (this['_' + propertyKey] === value) {
        return;
      }

      this['_' + propertyKey] = value;
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

export function BindThrowToReject (rejectKey: string, returnValue: any, isRejectedKey?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args) {
      try {
        return originalMethod.apply(this, args);
      } catch (err) {
        // if (isRejectedKey) this[isRejectedKey] = true;
        return this[rejectKey](err);
      }
    };

    return descriptor;
  };
}