import * as EventEmitter from 'events';

import Drivers from '../app/Drivers';
import I2cMaster, { DriverInstance as I2cMasterInstance } from './I2cMaster.driver';
import MyAddress from '../app/interfaces/MyAddress';


const DATA_TRANSFER_REGISTER_POSITION = 0;
const DATA_MARK_POSITION = 1;
const DATA_LENGTH_REQUEST = 3;

export class DriverInstance {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly drivers: Drivers;
  private readonly driverConfig: {[index: string]: any};
  private readonly myAddress: MyAddress;
  private readonly i2cDriver: I2cMasterInstance;
  private readonly eventName: string = 'data';
  private readonly defaultRegister: number = 0x00;
  private readonly lengthRegister: number = 0x1b;

  constructor(drivers: Drivers, driverConfig: {[index: string]: any}, myAddress: MyAddress) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
    this.myAddress = myAddress;

    const driver: I2cMaster = this.drivers.getDriver('I2cMaster');
    this.i2cDriver = driver.getInstance(this.myAddress.bus, this.myAddress.address);
  }

  init(): void {
    this.i2cDriver.listen();
  }

  send(register: number | undefined, data: Uint8Array): Promise<void> {
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

  listenIncome(register: number | undefined, handler: (data: Uint8Array) => void): void {
    // TODO: review
  }

  removeListener(register: number | undefined, handler: (data: Uint8Array) => void): void {
    // TODO: review
  }

  // requestData(bus: string, address: string): Promise<Buffer> {
  //   // TODO: Write and read - но не давать никому встать в очередь
  // }

}



export default class I2cMasterDataDriver {
  private readonly drivers: Drivers;
  private readonly driverConfig: {[index: string]: any};

  constructor(drivers: Drivers, driverConfig: {[index: string]: any} = {}) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
  }

  getInstance(myAddress: MyAddress) {
    return new DriverInstance(this.drivers, this.driverConfig, myAddress);
  }

}
