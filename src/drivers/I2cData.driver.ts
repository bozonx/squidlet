import * as EventEmitter from 'events';

import Drivers from '../app/Drivers';
import { hexToBytes, bytesToHexString, numToWord, wordToNum } from '../helpers/helpers';
import DriverFactoryBase from '../app/DriverFactoryBase';
import MyAddress from '../app/interfaces/MyAddress';
import {I2cMasterDriver} from './I2cMaster.driver';


const MAX_BLOCK_LENGTH = 65535;
const DATA_MARK_POSITION = 0;
const DATA_MARK_LENGTH = 1;
const DATA_LENGTH_REQUEST = 2;

export interface I2cDriverClass {
  write: (register: number | undefined, data: Uint8Array) => Promise<void>;
  listen: (register: number | undefined, length: number, handler: (data: Uint8Array) => void) => void;
  removeListener: (register: number | undefined, length: number, handler: (data: Uint8Array) => void) => void;
}


export class I2cDataDriver {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly bus: string | number;
  private readonly address: string | number;
  private readonly i2cDriver: I2cDriverClass;
  private readonly defaultDataMark: number = 0x00;
  private readonly lengthRegister: number = 0x1a;
  private readonly sendDataRegister: number = 0x1b;

  constructor(
    drivers: Drivers,
    driverParams: {[index: string]: any},
    i2cDriver: DriverFactoryBase,
    bus: string | number,
    address: string | number
  ) {
    this.bus = bus;
    this.address = address;
    this.i2cDriver = i2cDriver.getInstance(this.bus, this.address) as I2cDriverClass;
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
    const dataLengthHex: string = bytesToHexString(payload);
    const dataLength: number = wordToNum(dataLengthHex);

    const receiveDataCb = (payload: Uint8Array) => {
      if (payload.length < 2) throw new Error(`Incorrect received data length ${payload.length}`);
      const dataMark = payload[0];
      const data = new Uint8Array(payload.length - 1);

      payload.forEach((item, index) => {
        // skip index 0
        if (index === DATA_MARK_POSITION) return;

        data[index - DATA_MARK_LENGTH] = item;
      });

      // unlisten of data
      this.i2cDriver.removeListener(this.sendDataRegister, dataLength, receiveDataCb);
      // rise event
      this.events.emit(dataMark.toString(16), data);
    };

    // listen for data
    this.i2cDriver.listen(this.sendDataRegister, dataLength, receiveDataCb);
  }

  private async sendLength(dataLength: number): Promise<void> {
    // 16 bit (2 bytes) integer
    if (dataLength > MAX_BLOCK_LENGTH) {
      throw new Error(`Data is too long, allowed length until "${MAX_BLOCK_LENGTH}" bytes`);
    }

    // e.g 65535 => "ffff". To decode use - parseInt("ffff", 16)
    const lengthHex: string = numToWord(dataLength);
    const bytes: Uint8Array = hexToBytes(lengthHex);
    const lengthToSend: Uint8Array = new Uint8Array(bytes);

    this.i2cDriver.write(this.lengthRegister, lengthToSend);
  }

  private async sendData(dataMark: number, dataLength: number, data: Uint8Array): Promise<void> {
    const dataToSend: Uint8Array = new Uint8Array(dataLength + DATA_MARK_LENGTH);
    // add data mark
    dataToSend[DATA_MARK_POSITION] = dataMark;
    // fill array
    data.forEach((item, index) => dataToSend[index + DATA_MARK_LENGTH] = item);

    this.i2cDriver.write(this.sendDataRegister, dataToSend);
  }

}


export default class I2cDataFactory extends DriverFactoryBase {
  protected DriverClass: { new (
      drivers: Drivers,
      driverParams: {[index: string]: any},
      i2cDriver: DriverFactoryBase,
      bus: string,
      address: string
    ): I2cDataDriver } = I2cDataDriver;
}
