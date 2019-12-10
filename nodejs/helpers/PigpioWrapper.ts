import {callPromised} from '../../system/lib/common';


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


  constructor(gpio: any) {
    this.gpio = gpio;
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

  notify(cb: PigpioHandler) {
    this.gpio.notify(cb);
  }

  read(): Promise<number> {
    return callPromised(this.gpio.read);
  }

  write(value: number): Promise<void> {
    return callPromised(this.gpio.write, value);
  }

}
