import * as EventEmitter from 'events';

import Drivers from '../app/Drivers';
import { hexToBytes, bytesToHexString, numToWord, wordToNum } from '../helpers/helpers';
import DriverFactoryBase from '../app/DriverFactoryBase';
import * as _ from 'lodash';


const MAX_BLOCK_LENGTH = 65535;
const DATA_MARK_POSITION = 0;
const DATA_MARK_LENGTH = 1;
const DATA_LENGTH_REQUEST = 2;


export interface I2cDriverClass {
  write: (i2cAddress: string | number, dataAddress: number | undefined, data: Uint8Array) => Promise<void>;
  listenIncome: (
    i2cAddress: string | number,
    dataAddress: number | undefined,
    length: number,
    handler: (data: Uint8Array) => void
  ) => void;
  removeListener: (
    i2cAddress: string | number,
    dataAddress: number | undefined,
    length: number,
    handler: (data: Uint8Array) => void
  ) => void;
}


export class I2cDataDriver {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly bus: string | number;
  private readonly i2cDriver: I2cDriverClass;
  private readonly defaultDataMark: number = 0x00;
  private readonly lengthRegister: number = 0x1a;
  private readonly sendDataRegister: number = 0x1b;
  private readonly handlers: {[index: string]: Array<{ handler: (data: Uint8Array) => void, wrapper: Function }>} = {};

  constructor(
    drivers: Drivers,
    driverParams: {[index: string]: any},
    i2cDriver: DriverFactoryBase,
    // bus to use
    bus: string | number,
  ) {
    this.bus = bus;
    this.i2cDriver = i2cDriver.getInstance(this.bus) as I2cDriverClass;
  }

  init(): void {

    // TODO: где взять адрес ???
    // TODO: зачем тут init ????

    // this.i2cDriver.listenIncome(this.lengthRegister, DATA_LENGTH_REQUEST, this.handleIncomeLength);
  }

  async send(i2cAddress: string | number, dataMark: number | undefined, data: Uint8Array): Promise<void> {
    if (!data.length) throw new Error(`Nothing to send`);

    const resolvedDataMark = this.resolveDataMark(dataMark);
    const dataLength = data.length;

    await this.sendLength(i2cAddress, dataLength);
    await this.sendData(i2cAddress, resolvedDataMark, dataLength, data);
  }

  listenIncome(i2cAddress: string | number, dataMark: number | undefined, handler: (payload: Uint8Array) => void): void {
    const resolvedDataMark = this.resolveDataMark(dataMark);
    const dataId = resolvedDataMark.toString(16);

    const wrapper = async (payload: Uint8Array) => {
      const dataLength: number = this.lengthBytesToNumber(payload);

      try {
        const payload: Uint8Array = await this.receiveData(i2cAddress, resolvedDataMark, dataLength);
        handler(payload);
      }
      catch(err) {
        // TODO: !!!! что делать в случае ошибки
      }
    };

    if (!this.handlers[dataId]) this.handlers[dataId] = [];
    this.handlers[dataId].push({
      wrapper,
      handler,
    });

    this.i2cDriver.listenIncome(i2cAddress, this.lengthRegister, DATA_LENGTH_REQUEST, wrapper);
  }

  removeListener(i2cAddress: string | number, dataMark: number | undefined, handler: (data: Uint8Array) => void): void {
    const resolvedDataMark = this.resolveDataMark(dataMark);
    const dataId = resolvedDataMark.toString(16);

    const handlers = this.handlers[dataId];
    const handlerIndex = _.findIndex(handlers, (item) => {
      return item.handler === handler;
    });

    if (handlerIndex < 0) throw new Error(`Can't find handler index of "${dataId}"`);

    const wrapper = this.handlers[dataId][handlerIndex].wrapper as (data: Uint8Array) => void;

    // unlisten
    this.i2cDriver.removeListener(i2cAddress, this.lengthRegister, DATA_LENGTH_REQUEST, wrapper);

    // remove handler
    handlers.splice(handlerIndex, 1);

    if (!this.handlers[dataId].length) {
      delete this.handlers[dataId];
    }

  }

  private receiveData(
    i2cAddress: string | number,
    dataMark: number,
    dataLength: number,
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      // TODO: в каком случае ошибка ??? если таймаут?
      // TODO: review
      // TODO: dataMark

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
        this.i2cDriver.removeListener(i2cAddress, this.sendDataRegister, dataLength, receiveDataCb);

        resolve(data);
      };

      // listen for data
      this.i2cDriver.listenIncome(i2cAddress, this.sendDataRegister, dataLength, receiveDataCb);
    });
  }

  private async sendLength(i2cAddress: string | number, dataLength: number): Promise<void> {
    // max is 0xffff - 16 bit (2 bytes) integer
    if (dataLength > MAX_BLOCK_LENGTH) {
      throw new Error(`Data is too long, allowed length until "${MAX_BLOCK_LENGTH}" bytes`);
    }

    // e.g 65535 => "ffff". To decode use - parseInt("ffff", 16)
    const lengthHex: string = numToWord(dataLength);
    const bytes: Uint8Array = hexToBytes(lengthHex);
    const lengthToSend: Uint8Array = new Uint8Array(bytes);

    this.i2cDriver.write(i2cAddress, this.lengthRegister, lengthToSend);
  }

  private async sendData(i2cAddress: string | number, dataMark: number, dataLength: number, data: Uint8Array): Promise<void> {
    const dataToSend: Uint8Array = new Uint8Array(dataLength + DATA_MARK_LENGTH);
    // add data mark
    dataToSend[DATA_MARK_POSITION] = dataMark;
    // fill array
    data.forEach((item, index) => dataToSend[index + DATA_MARK_LENGTH] = item);

    this.i2cDriver.write(i2cAddress, this.sendDataRegister, dataToSend);
  }

  private resolveDataMark(dataMark: number | undefined): number {
    return (typeof dataMark === 'undefined') ? this.defaultDataMark : dataMark;
  }

  private lengthBytesToNumber(bytes: Uint8Array): number {
    const dataLengthHex: string = bytesToHexString(bytes);

    return wordToNum(dataLengthHex);
  }

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      drivers: Drivers,
      driverParams: {[index: string]: any},
      i2cDriver: DriverFactoryBase,
      bus: string
    ): I2cDataDriver } = I2cDataDriver;
}
