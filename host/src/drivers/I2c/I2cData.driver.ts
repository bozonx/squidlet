import DriverEnv from '../../app/DriverEnv';
import { hexToBytes, bytesToHexString, numToWord, wordToNum, withoutFirstItemUint8Arr } from '../../helpers/helpers';
import DriverFactoryBase from '../../app/DriverFactoryBase';
import HandlersManager from '../../helpers/HandlersManager';
import {EntityProps} from '../../app/interfaces/EntityDefinition';


const MAX_BLOCK_LENGTH = 65535;
const DATA_MARK_POSITION = 0;
// length in bytes of data length request
const DATA_LENGTH_REQUEST = 3;
const MIN_DATA_LENGTH = 1;

export type DataHandler = (error: Error | null, payload?: Uint8Array) => void;
type I2cDriverHandler = (error: Error | null, data?: Uint8Array) => void;

export interface I2cDriverClass {
  write: (i2cAddress: string | number | undefined, dataAddress: number | undefined, data: Uint8Array) => Promise<void>;
  read: (i2cAddress: string | number | undefined, dataAddress: number | undefined, length: number) => Promise<Uint8Array>;
  listenIncome: (
    i2cAddress: string | number | undefined,
    dataAddress: number | undefined,
    length: number,
    handler: I2cDriverHandler
  ) => void;
  removeListener: (
    i2cAddress: string | number | undefined,
    dataAddress: number | undefined,
    handler: I2cDriverHandler
  ) => void;
}


export class I2cDataDriver {
  private readonly bus: string | number;
  private readonly i2cDriver: I2cDriverClass;
  private readonly defaultDataMark: number = 0x00;
  private readonly lengthRegister: number = 0x1a;
  private readonly sendDataRegister: number = 0x1b;
  private handlersManager: HandlersManager<DataHandler, I2cDriverHandler> = new HandlersManager<DataHandler, I2cDriverHandler>();

  constructor(
    props: EntityProps,
    env: DriverEnv,
    i2cDriver: DriverFactoryBase,
    // TODO: почему не в props???
    // bus to use
    bus: string | number,
  ) {
    this.bus = bus;
    // TODO: можно же самому запросить из drivers
    this.i2cDriver = i2cDriver.getInstance(this.bus) as I2cDriverClass;
  }

  async send(i2cAddress: string | number | undefined, dataMark: number | undefined, data: Uint8Array): Promise<void> {
    if (!data.length) throw new Error(`Nothing to send`);

    const resolvedDataMark: number = this.resolveDataMark(dataMark);

    await this.sendLength(i2cAddress, resolvedDataMark, data.length);
    await this.i2cDriver.write(i2cAddress, this.sendDataRegister, data);
  }

  listenIncome(i2cAddress: string | number | undefined, dataMark: number | undefined, handler: DataHandler): void {
    const resolvedDataMark = this.resolveDataMark(dataMark);
    const dataId: string = this.generateId(i2cAddress, resolvedDataMark);

    const wrapper = async (error: Error | null, payload?: Uint8Array): Promise<void> => {
      await this.handleIncome(i2cAddress, resolvedDataMark, handler, error, payload);
    };

    this.handlersManager.addHandler(dataId, handler, wrapper);
    this.i2cDriver.listenIncome(i2cAddress, this.lengthRegister, DATA_LENGTH_REQUEST, wrapper);
  }

  removeListener(i2cAddress: string | number | undefined, dataMark: number | undefined, handler: DataHandler): void {
    const resolvedDataMark: number = this.resolveDataMark(dataMark);
    const dataId: string = this.generateId(i2cAddress, resolvedDataMark);
    const wrapper: DataHandler = this.handlersManager.getWrapper(dataId, handler) as DataHandler;

    // unlisten
    this.i2cDriver.removeListener(i2cAddress, this.lengthRegister, wrapper);
    this.handlersManager.removeByHandler(dataId, handler);
  }

  private async sendLength(i2cAddress: string | number | undefined, dataMark: number, dataLength: number): Promise<void> {
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
    const lengthToSend: Uint8Array = new Uint8Array(DATA_LENGTH_REQUEST);

    lengthToSend[DATA_MARK_POSITION] = dataMark;
    lengthToSend[1] = bytes[0];
    lengthToSend[2] = bytes[1];

    await this.i2cDriver.write(i2cAddress, this.lengthRegister, lengthToSend);
  }

  private resolveDataMark(dataMark: number | undefined): number {
    return (typeof dataMark === 'undefined') ? this.defaultDataMark : dataMark;
  }

  private lengthBytesToNumber(bytes: Uint8Array): number {
    const dataLengthHex: string = bytesToHexString(bytes);

    return wordToNum(dataLengthHex);
  }

  private async handleIncome(
    i2cAddress: string | number | undefined,
    dataMark: number,
    handler: DataHandler,
    error: Error | null,
    payload?: Uint8Array
  ): Promise<void> {
    if (error)  return handler(error);
    if (!payload) return handler(new Error(`Payload is undefined`));
    // do nothing if it isn't my data mark
    if (dataMark !== payload[DATA_MARK_POSITION]) return;

    const lengthBytes: Uint8Array = withoutFirstItemUint8Arr(payload);
    const dataLength: number = this.lengthBytesToNumber(lengthBytes);

    // receive data with this length
    try {
      const data: Uint8Array = await this.i2cDriver.read(i2cAddress, this.sendDataRegister, dataLength);

      if (data.length !== dataLength) {
        return handler(new Error(`Incorrect received data length ${data.length}`));
      }

      handler(null, data);
    }
    catch(err) {
      handler(err);
    }
  }

  private generateId(i2cAddress: string | number | undefined, dataMark: number): string {
    // for master
    if (typeof i2cAddress === 'undefined') {
      return dataMark.toString(16);
    }

    return [ i2cAddress.toString(), dataMark.toString(16) ].join('-');
  }

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      props: EntityProps,
      env: DriverEnv,
      i2cDriver: DriverFactoryBase,
      bus: string
    ): I2cDataDriver } = I2cDataDriver;
}
