import * as EventEmitter from 'events';

import DevI2c from '../dev/I2c';
import { stringToHex } from '../helpers/helpers';
import Drivers from '../app/Drivers';

// TODO: сделать поддержку poling
// TODO: сделать поддержку int


export default class I2cSlaveDriver {
  // TODO: выставить из конфига
  readonly blockLength: number = 32;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly eventName: string = 'data';

  constructor(drivers: Drivers, driverParams: {[index: string]: any}) {

  }

  send(bus: string, address: string, register: number | undefined, data: Uint8Array): Promise<void> {

  }

  addListener(bus: string, address: string, register: number | undefined, length: number, handler: (data: Uint8Array) => void): void {
    // TODO: если не указар register - то принимать все данные
  }

  removeListener(bus: string, address: string, register: number | undefined, handler: (data: Uint8Array) => void): void {
  }

}
