import * as EventEmitter from 'events';

import Drivers from '../app/Drivers';
import MyAddress from '../app/interfaces/MyAddress';
import { hexToBytes, bytesToHex } from '../helpers/helpers';


const MAX_BLOCK_LENGTH = 65535;
const DATA_MARK_POSITION = 0;
const DATA_MARK_LENGTH = 1;
const DATA_LENGTH_REQUEST = 2;

export interface I2cDriverInstance {
  write: (register: number | undefined, data: Uint8Array) => Promise<void>;
  listen: (register: number | undefined, length: number, handler: (data: Uint8Array) => void) => void;
  removeListener: (register: number | undefined, handler: (data: Uint8Array) => void) => void;
}

export interface I2cDriver {
  getInstance: (bus: string, address: string) => I2cDriverInstance;
}

export class DriverInstance {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly myAddress: MyAddress;
  private readonly i2cDriver: I2cDriverInstance;
  private readonly defaultDataMark: number = 0x00;
  private readonly lengthRegister: number = 0x1a;
  private readonly sendDataRegister: number = 0x1b;

  constructor(i2cDriver: I2cDriver, myAddress: MyAddress) {
    this.myAddress = myAddress;
    this.i2cDriver = i2cDriver.getInstance(this.myAddress.bus, this.myAddress.address);
  }

  init(): void {
    this.i2cDriver.listen(this.lengthRegister, DATA_LENGTH_REQUEST, this.handleIncomeLength);
  }

  async send(dataMark: number | undefined, data: Uint8Array): Promise<void> {
    if (!data.length) throw new Error(`Nothing to send`);

    const completeDataMark = (typeof dataMark === 'undefined') ? this.defaultDataMark : dataMark;
    const dataLength = data.length;

    await this.sendLength(dataLength);
    await this.sendData(completeDataMark, dataLength, data);
  }

  listenIncome(dataMark: number | undefined, handler: (data: Uint8Array) => void): void {
    const completeDataMark = (typeof dataMark === 'undefined') ? this.defaultDataMark : dataMark;

    this.events.addListener(completeDataMark.toString(16), handler);
  }

  removeListener(dataMark: number | undefined, handler: (data: Uint8Array) => void): void {
    const completeDataMark = (typeof dataMark === 'undefined') ? this.defaultDataMark : dataMark;

    this.events.removeListener(completeDataMark.toString(16), handler);
  }

  private handleIncomeLength = (payload: Uint8Array): void => {
    const dataLengthHex = bytesToHex(payload);
    const dataLength = parseInt(dataLengthHex, 16);

    const receiveDataCb = (payload: Uint8Array) => {
      if (payload.length < 2) throw new Error(`Incorrect received data length ${payload.length}`);
      const dataMark = payload[0];
      const data = new Uint8Array(payload.length - 1);

      // TODO: упростить - должен быть что-то вроде unshift
      data.forEach((item, index) => {
        // skip index 0
        if (index === DATA_MARK_POSITION) return;

        data[index - DATA_MARK_LENGTH] = item;
      });

      this.events.emit(dataMark.toString(16), data);
    };

    // TODO: наверное дату слушать постоянно и сохранять последнюю на несколько секунд пока не будет прочитанно

    // listen for data
    this.i2cDriver.listen(this.sendDataRegister, dataLength, receiveDataCb);
  }

  private async sendLength(dataLength: number): Promise<void> {
    // 16 bit (2 bytes) integer
    if (dataLength > MAX_BLOCK_LENGTH) {
      throw new Error(`Data is too long, allowed length until "${MAX_BLOCK_LENGTH}" bytes`);
    }

    // e.g 65535 => "ffff". To decode use - parseInt("ffff", 16)
    const lengthHex = dataLength.toString(16);
    const lengthToSend: Uint8Array = new Uint8Array(hexToBytes(lengthHex));

    this.i2cDriver.write(this.lengthRegister, lengthToSend);
  }

  private async sendData(dataMark: number, dataLength: number, data: Uint8Array): Promise<void> {
    const dataToSend: Uint8Array = new Uint8Array(dataLength + DATA_MARK_LENGTH);
    // add data mark
    dataToSend[DATA_MARK_POSITION] = dataMark;
    // TODO: упростить - использовать spread ???
    // fill array
    data.forEach((item, index) => dataToSend[index + DATA_MARK_LENGTH] = item);

    this.i2cDriver.write(this.sendDataRegister, dataToSend);
  }

}


export default class I2cMasterDataDriver {
  private readonly drivers: Drivers;
  private readonly driverConfig: {[index: string]: any};

  constructor(drivers: Drivers, driverConfig: {[index: string]: any} = {}) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
  }

  getInstance(i2cDriver: I2cDriver, myAddress: MyAddress) {
    return new DriverInstance(i2cDriver, myAddress);
  }

}
