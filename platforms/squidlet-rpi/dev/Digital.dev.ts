import {Gpio} from 'onoff';

import Digital, {Edge, PinMode, WatchHandler} from '../../../host/src/app/interfaces/dev/Digital';

// it supports also 'high' | 'low'
type GpioMode = 'in' | 'out';


// TODO: add unexport


class DigitalDev implements Digital {
  private pinInstances: {[index: string]: Gpio} = {};

  async setup(pin: number, pinMode: PinMode): Promise<void> {
    this.pinInstances[pin] = new Gpio(pin, this.convertMode());

    // TODO: установить первичное значение на output пине
    // TODO: установить pullup / pulldown резистор

  }

  read(pin: number): Promise<boolean> {
    const pinInstance = this.getPinInstance(pin, 'in');

    return new Promise((resolve, reject) => {
      pinInstance.read((err: Error, value) => {
        if (err) return reject(err);

        resolve(Boolean(value));
      });
    });
  }

  write(pin: number, value: boolean): Promise<void> {
    const pinInstance = this.getPinInstance(pin, 'out');
    const numValue = (value) ? 1 : 0;

    return new Promise((resolve, reject) => {
      pinInstance.write(numValue, (err: Error) => {
        if (err) return reject(err);

        resolve();
      });
    });
  }

  setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): number {
    const pinInstance = this.getPinInstance(pin, 'in');
    // TODO: debounce и endge сделать программно

    pinInstance.watch((err, value) => {
      if (err) {
        throw err;
      }

    });
  }

  clearWatch(id: number): void {
    // unwatch
  }

  clearAllWatches(): void {

    // TODO: get any pin

    //new Gpio().unwatchAll();
  }

  private convertMode(): GpioMode {

  }

  private getPinInstance(pin: number, mode: GpioMode): Gpio {
    if (!this.pinInstances[pin]) return this.pinInstances[pin];

    this.pinInstances[pin] = new Gpio(pin, mode);

    return this.pinInstances[pin];
  }

}


export default new DigitalDev();
