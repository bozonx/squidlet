import * as EventEmitter from 'events';

import DevI2c from '../dev/I2cMaster';
import { hexStringToHexNum } from '../helpers/helpers';
import Drivers from '../app/Drivers';

// TODO: сделать поддержку poling
// TODO: сделать поддержку int


export class DriverInstance {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly eventName: string = 'data';
  private readonly bus: number;
  private readonly address: number;

  constructor(drivers: Drivers, driverParams: {[index: string]: any}, bus: string, address: string) {
    // TODO: bus и address привести к типу
  }

  write(bus: string, address: string, register: number | undefined, data: Uint8Array): Promise<void> {

  }

  listen(bus: string, address: string, register: number | undefined, length: number, handler: (data: Uint8Array) => void): void {
    // TODO: если не указар register - то принимать все данные
  }

  removeListener(bus: string, address: string, register: number | undefined, handler: (data: Uint8Array) => void): void {
  }

}


export default class I2cSlaveDriver {
  private readonly drivers: Drivers;
  private readonly driverConfig: {[index: string]: any};

  constructor(drivers: Drivers, driverConfig: {[index: string]: any} = {}) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
  }

  getInstance(bus: string, address: string) {
    return new DriverInstance(this.drivers, this.driverConfig, bus, address);
  }

}
