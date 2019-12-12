import {callPromised} from '../../system/lib/common';
import {removeItemFromArray} from '../../system/lib/arrays';


export type PigpioHandler = (level: number, tick: number) => void;

export interface PigpioOptions {
  host?: string;
  port?: number;
  timeout?: number;
}

export interface PigpioInfo {
  host: string;
  // default is 8888
  port: number;
  timeout: number;
  pipelining: boolean;
  commandSocket: boolean;
  notificationSocket: boolean;
  pigpioVersion: number;
  hwVersion: number;
  hardware_type: number;
  userGpioMask: number;
  version: string;
}


/**
 * Wrapper of pigpio-client's gpio to use promises.
 */
export default class PigpioWrapper {
  private gpio: any;
  private listeners: PigpioHandler[] = [];


  constructor(gpio: any) {
    this.gpio = gpio;
  }

  destroy() {
    this.$removeListeners();
    delete this.listeners;
    delete this.gpio;
  }

  $removeListeners() {
    // TODO: make it on disconnect
    for (let cb of this.listeners) {
      this.gpio.endNotify(cb);
    }
  }

  $renew(gpio: any) {

    this.gpio = gpio;

    for (let cb of this.listeners) {
      this.gpio.notify(cb);
    }
  }

  modeSet(mode: 'input' | 'output'): Promise<void> {
    return callPromised(this.gpio.modeSet, mode);
  }

  modeGet(): Promise<number> {
    return callPromised(this.gpio.modeGet);
  }

  pullUpDown(pullUpDown: number): Promise<void> {
    return callPromised(this.gpio.pullUpDown, pullUpDown);
  }

  read(): Promise<number> {
    return callPromised(this.gpio.read);
  }

  write(value: number): Promise<void> {
    return callPromised(this.gpio.write, value);
  }

  notify(cb: PigpioHandler) {
    this.listeners.push(cb);
    this.gpio.notify(cb);
  }

  endNotify(cb: PigpioHandler) {
    this.gpio.endNotify(cb);

    this.listeners = removeItemFromArray(this.listeners, cb);
  }

}
