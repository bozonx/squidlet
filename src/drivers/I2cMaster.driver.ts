import * as EventEmitter from 'events';

import DevI2c from '../dev/I2c';
import { stringToHex } from '../helpers/helpers';
import Drivers from "../app/Drivers";

// TODO: сделать поддержку poling
// TODO: сделать поддержку int


export default class I2c {
  // TODO: выставить из конфига
  readonly blockLength: number = 32;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly eventName: string = 'data';

  constructor(drivers: Drivers, driverParams: {[index: string]: any}) {

  }

  read(bus: string, address: string, length: number): Promise<Uint8Array> {
    // TODO: прочитать один раз данные
  }

  write(bus: string, address: string, data: Uint8Array): Promise<void> {
    // TODO: наверное дожидаться  таймаута соединения и обрывать
    const hexAddr = stringToHex(address);
  }

  listen(bus: string, address: string, length: number, handler: (data: Uint8Array) => void): void {
    // TODO: публикуем пришедшие данные заданной длинны
    // TODO: при установке первого листенера - запускается полинг или слушается int
    // TODO: вешать на конкретный bus и address

    this.events.removeListener(this.eventName, handler);
  }

  unlisten(bus: string, address: string, handler: (data: Uint8Array) => void): void {

    // TODO: использовать bus и address

    this.events.removeListener(this.eventName, handler);
  }

  // request(bus: string, address: string, dataAddr: number, data: Buffer): Promise<Buffer> {
  //   // Write and read - но не давать никому встать в очередь
  // }

}
