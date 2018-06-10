import * as EventEmitter from 'events';

import DevI2c from '../dev/I2c';
import { stringToHex } from '../helpers/helpers';
import Drivers from '../app/Drivers';

// TODO: сделать поддержку poling
// TODO: сделать поддержку int


export default class I2cMasterDriver {
  // TODO: выставить из конфига
  readonly blockLength: number = 32;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly eventName: string = 'data';

  constructor(drivers: Drivers, driverParams: {[index: string]: any}) {

  }

  send(bus: string, address: string, register: number | undefined, data: Uint8Array): Promise<void> {
    // TODO: если не указар register - то данные отправлять как есть без подстановки регистра
    // TODO: наверное дожидаться  таймаута соединения и обрывать
    const hexAddr = stringToHex(address);
  }

  addListener(bus: string, address: string, register: number | undefined, length: number, handler: (data: Uint8Array) => void): void {
    // TODO: если не указар register - то принимать все данные
    // TODO: публикуем пришедшие данные заданной длинны
    // TODO: при установке первого листенера - запускается полинг или слушается int
    // TODO: вешать на конкретный bus и address

    this.events.removeListener(this.eventName, handler);
  }

  removeListener(bus: string, address: string, register: number | undefined, handler: (data: Uint8Array) => void): void {

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
