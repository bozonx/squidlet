import * as EventEmitter from 'events';

import DevI2c from '../dev/I2cMaster';
import { hexStringToHexNum } from '../helpers/helpers';
import Drivers from '../app/Drivers';
import MyAddress from '../app/interfaces/MyAddress';

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

  write(register: number | undefined, data: Uint8Array): Promise<void> {
    // TODO: если не указар register - то данные отправлять как есть без подстановки регистра
    // TODO: наверное дожидаться  таймаута соединения и обрывать
    const hexAddr = hexStringToHexNum(address);
  }

  listen(register: number | undefined, length: number, handler: (data: Uint8Array) => void): void {
    // TODO: если не указар register - то принимать все данные
    // TODO: публикуем пришедшие данные заданной длинны
    // TODO: при установке первого листенера - запускается полинг или слушается int
    // TODO: вешать на конкретный bus и address

    this.events.removeListener(this.eventName, handler);
  }

  removeListener(register: number | undefined, handler: (data: Uint8Array) => void): void {

    // TODO: использовать bus и address

    this.events.removeListener(this.eventName, handler);
  }


  read(bus: string, address: string, length: number): Promise<Uint8Array> {
    // TODO: прочитать один раз данные - только для мастера
  }

  // request(bus: string, address: string, dataAddr: number, data: Buffer): Promise<Buffer> {
  //   // Write and read - но не давать никому встать в очередь
  // }

}


export default class I2cMasterDriver {
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
