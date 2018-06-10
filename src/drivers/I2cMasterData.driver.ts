import * as EventEmitter from 'events';

import Drivers from '../app/Drivers';
import I2cDriver from './I2cMaster.driver';


export default class I2cMasterDataDriver {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly drivers: Drivers;
  private readonly i2cDriver: I2cDriver;
  private readonly eventName: string = 'data';

  constructor(drivers: Drivers) {
    this.drivers = drivers;
    this.i2cDriver = this.drivers.getDriver('I2c');
  }

  send(bus: string, address: string, register: number | undefined, data: Uint8Array): Promise<void> {
    // TODO: добавляем к данным в начало свой регистр если есть или дефолтный - это метка сообщения
    // TODO: отправляем на регистр приема длинны сообщения длинну сообщения 16 бит
    // TODO: там длинна принимается и ожидается на регистре приема данных
    // TODO: передаем на регистр приема данных данные заданной длинны
  }

  listenIncome(bus: string, address: string, register: number | undefined, length: number, handler: (data: Uint8Array) => void): void {
    // TODO: review
  }

  removeListener(bus: string, address: string, register: number | undefined, handler: (data: Uint8Array) => void): void {
    // TODO: review
  }

  // requestData(bus: string, address: string): Promise<Buffer> {
  //   // TODO: Write and read - но не давать никому встать в очередь
  // }

}
