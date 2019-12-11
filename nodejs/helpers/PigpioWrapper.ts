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
  private getGpio: () => any;


  constructor(getGpio: () => any) {
    this.getGpio = getGpio;
  }


  modeSet(mode: 'input' | 'output'): Promise<void> {
    return callPromised(this.getGpio().modeSet, mode);
  }

  modeGet(): Promise<number> {
    return callPromised(this.getGpio().modeGet);
  }

  pullUpDown(pullUpDown: number): Promise<void> {
    return callPromised(this.getGpio().pullUpDown, pullUpDown);
  }

  read(): Promise<number> {
    return callPromised(this.getGpio().read);
  }

  write(value: number): Promise<void> {
    return callPromised(this.getGpio().write, value);
  }

  notify(cb: PigpioHandler) {
    this.getGpio().notify(cb);
  }

  endNotify(cb: PigpioHandler) {
    this.getGpio().endNotify(cb);
  }

}
