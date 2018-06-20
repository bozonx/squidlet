import Drivers from '../app/Drivers';
import { hexToBytes, bytesToHexString, numToWord, wordToNum, withoutFirstItemUnit8Arr } from '../helpers/helpers';
import DriverFactoryBase from '../app/DriverFactoryBase';


const MAX_BLOCK_LENGTH = 65535;
const DATA_MARK_POSITION = 0;
const DATA_MARK_LENGTH = 1;
const DATA_LENGTH_REQUEST = 2;
const MIN_DATA_LENGTH = 1;

export type DataHandler = (error: Error | null, payload?: Uint8Array) => void;
type I2cDriverHandler = (error: Error | null, data?: Uint8Array) => void;

export interface I2cDriverClass {
  write: (i2cAddress: string | number, dataAddress: number | undefined, data: Uint8Array) => Promise<void>;
  read: (i2cAddress: string | number, dataAddress: number | undefined, length: number) => Promise<Uint8Array>;
  listenIncome: (
    i2cAddress: string | number,
    dataAddress: number | undefined,
    length: number,
    handler: I2cDriverHandler
  ) => void;
  removeListener: (
    i2cAddress: string | number,
    dataAddress: number | undefined,
    length: number,
    handler: I2cDriverHandler
  ) => void;
}

interface HandlerItem {
  handler: DataHandler;
  wrapper: I2cDriverHandler;
}


export class I2cDataDriver {
  private readonly bus: string | number;
  private readonly i2cDriver: I2cDriverClass;
  private readonly defaultDataMark: number = 0x00;
  private readonly lengthRegister: number = 0x1a;
  private readonly sendDataRegister: number = 0x1b;
  private readonly handlers: {[index: string]: Array<HandlerItem>} = {};

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

  async send(i2cAddress: string | number, dataMark: number | undefined, data: Uint8Array): Promise<void> {
    if (!data.length) throw new Error(`Nothing to send`);

    const resolvedDataMark: number = this.resolveDataMark(dataMark);
    const dataLength = data.length;

    await this.sendLength(i2cAddress, dataLength);
    await this.sendData(i2cAddress, resolvedDataMark, dataLength, data);
  }

  listenIncome(i2cAddress: string | number, dataMark: number | undefined, handler: DataHandler): void {
    const resolvedDataMark = this.resolveDataMark(dataMark);
    const dataId: string = resolvedDataMark.toString(16);

    const wrapper = (error: Error | null, payload?: Uint8Array): void => {
      this.handleIncome(i2cAddress, resolvedDataMark, handler, error, payload);
    };

    this.saveHandler(dataId, handler, wrapper);
    this.i2cDriver.listenIncome(i2cAddress, this.lengthRegister, DATA_LENGTH_REQUEST, wrapper);
  }

  removeListener(i2cAddress: string | number, dataMark: number | undefined, handler: DataHandler): void {
    const resolvedDataMark: number = this.resolveDataMark(dataMark);
    const dataId: string = resolvedDataMark.toString(16);
    const { wrapper, handlerIndex } = this.findWrapper(dataId, handler);

    // unlisten
    this.i2cDriver.removeListener(i2cAddress, this.lengthRegister, DATA_LENGTH_REQUEST, wrapper);

    // remove handler
    this.handlers[dataId].splice(handlerIndex, 1);
    // remove container if it is an empty
    if (!this.handlers[dataId].length) {
      delete this.handlers[dataId];
    }
  }


  private async receiveData(
    i2cAddress: string | number,
    dataMark: number,
    dataLength: number,
  ): Promise<Uint8Array> {
    const payload = await this.i2cDriver.read(i2cAddress, this.sendDataRegister, dataLength);
    const receivedDataMark = payload[0];

    if (dataMark !== receivedDataMark) {
      throw new Error(`Incorrect received data mark ${receivedDataMark}. Expected ${dataMark}`);
    }

    if (payload.length !== dataLength) {
      throw new Error(`Incorrect received data length ${payload.length}`);
    }

    return withoutFirstItemUnit8Arr(payload);


    // return new Promise((resolve, reject) => {
    //   const receiveDataCb = (error: Error | null, payload?: Uint8Array): void => {
    //     if (error)  return reject(error);
    //     if (!payload) return reject(new Error(`Payload is undefined`));
    //
    //     const receivedDataMark = payload[0];
    //
    //     if (dataMark !== receivedDataMark) return;
    //
    //     if (payload.length !== dataLength) {
    //       return reject(new Error(`Incorrect received data length ${payload.length}`));
    //     }
    //
    //     const data: Uint8Array = withoutFirstItemUnit8Arr(payload);
    //
    //     // unlisten of data
    //     this.i2cDriver.removeListener(i2cAddress, this.sendDataRegister, dataLength, receiveDataCb);
    //
    //     resolve(data);
    //   };
    //
    //   // temporary listen for data
    //   this.i2cDriver.listenIncome(i2cAddress, this.sendDataRegister, dataLength, receiveDataCb);
    // });
  }

  private async sendLength(i2cAddress: string | number, dataLength: number): Promise<void> {
    if (dataLength < MIN_DATA_LENGTH) {
      throw new Error(`Incorrect received data length ${dataLength}`);
    }

    // max is 0xffff - 16 bit (2 bytes) integer
    if (dataLength > MAX_BLOCK_LENGTH) {
      throw new Error(`Data is too long, allowed length until "${MAX_BLOCK_LENGTH}" bytes`);
    }

    // e.g 65535 => "ffff". To decode use - parseInt("ffff", 16)
    const lengthHex: string = numToWord(dataLength);
    const bytes: Uint8Array = hexToBytes(lengthHex);
    const lengthToSend: Uint8Array = new Uint8Array(bytes);

    await this.i2cDriver.write(i2cAddress, this.lengthRegister, lengthToSend);
  }

  private async sendData(i2cAddress: string | number, dataMark: number, dataLength: number, data: Uint8Array): Promise<void> {
    const dataToSend: Uint8Array = new Uint8Array(dataLength + DATA_MARK_LENGTH);
    // add data mark
    dataToSend[DATA_MARK_POSITION] = dataMark;
    // fill array
    data.forEach((item, index) => dataToSend[index + DATA_MARK_LENGTH] = item);

    await this.i2cDriver.write(i2cAddress, this.sendDataRegister, dataToSend);
  }

  private resolveDataMark(dataMark: number | undefined): number {
    return (typeof dataMark === 'undefined') ? this.defaultDataMark : dataMark;
  }

  private lengthBytesToNumber(bytes: Uint8Array): number {
    const dataLengthHex: string = bytesToHexString(bytes);

    return wordToNum(dataLengthHex);
  }

  private handleIncome(
    i2cAddress: string | number,
    dataMark: number,
    handler: DataHandler,
    error: Error | null,
    payload?: Uint8Array
  ): void {
    if (error)  return handler(error);
    if (!payload) return handler(new Error(`Payload is undefined`));

    const dataLength: number = this.lengthBytesToNumber(payload);

    // receive data with this length
    this.receiveData(i2cAddress, dataMark, dataLength)
      .then((payload: Uint8Array) => handler(null, payload))
      .catch((err) => handler(err));
  }

  private saveHandler(dataId: string, handler: DataHandler, wrapper: I2cDriverHandler) {
    if (!this.handlers[dataId]) this.handlers[dataId] = [];
    this.handlers[dataId].push({
      wrapper,
      handler,
    });
  }

  /**
   * Find wrapper of handler in this.handlers
   */
  private findWrapper(dataId: string, handler: DataHandler): { wrapper: I2cDriverHandler, handlerIndex: number } {
    const handlers: Array<HandlerItem> = this.handlers[dataId];
    const handlerIndex: number = handlers.findIndex((item) => {
      return item.handler === handler;
    });

    if (handlerIndex < 0) throw new Error(`Can't find handler index of "${dataId}"`);

    return {
      wrapper: this.handlers[dataId][handlerIndex].wrapper,
      handlerIndex,
    };
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
