import * as EventEmitter from 'events';

import Drivers from '../app/Drivers';
import I2cDriver from './I2cMaster.driver';


const DATA_TRANSFER_REGISTER_POSITION = 0;
const DATA_MARK_POSITION = 1;
const DATA_LENGTH_REQUEST = 3;

export default class I2cMasterDataDriver {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly drivers: Drivers;
  private readonly i2cDriver: I2cDriver;
  private readonly eventName: string = 'data';
  private readonly defaultRegister: number = 0x00;
  private readonly lengthRegister: number = 0x1b;

  constructor(drivers: Drivers) {
    this.drivers = drivers;
    this.i2cDriver = this.drivers.getDriver('I2c');
  }

  send(bus: string, address: string, register: number | undefined, data: Uint8Array): Promise<void> {
    const dataOffset = 2;
    const lengthToSend:Uint8Array = new Uint8Array(DATA_LENGTH_REQUEST);
    // data transfer register
    lengthToSend[DATA_TRANSFER_REGISTER_POSITION] = this.lengthRegister;
    // data mark
    //lengthToSend[DATA_MARK_POSITION] = (typeof register === 'undefined') ? this.defaultRegister : register;

    // TODO: формируем длинну данных из 2х байт

    // TODO: упростить
    // data.forEach((item, index) => {
    //   dataToSend[index + dataOffset] = item;
    // });

    // TODO: отправляем на регистр приема длинны сообщения длинну сообщения 16 бит
    // TODO: там длинна принимается и ожидается на регистре приема данных
    // TODO: передаем на регистр приема данных данные заданной длинны
  }

  listenIncome(bus: string, address: string, register: number | undefined, handler: (data: Uint8Array) => void): void {
    // TODO: review
  }

  removeListener(bus: string, address: string, register: number | undefined, handler: (data: Uint8Array) => void): void {
    // TODO: review
  }

  // requestData(bus: string, address: string): Promise<Buffer> {
  //   // TODO: Write and read - но не давать никому встать в очередь
  // }

}
