const _isEqual = require('lodash/isEqual');
import * as EventEmitter from 'events';

import {EntityProps} from '../../app/interfaces/EntityDefinition';
import DriverFactoryBase from '../../app/DriverFactoryBase';
import I2cMasterDev from '../../app/interfaces/dev/I2cMaster.dev';
import { hexStringToHexNum, addFirstItemUint8Arr } from '../../helpers/helpers';
import DriverEnv from '../../app/DriverEnv';
import Poling from '../../helpers/Poling';


const REGISTER_POSITION = 0;
const REGISTER_LENGTH = 1;

type Handler = (error: Error | null, data?: Uint8Array) => void;


export class I2cMasterDriver {
  private readonly env: DriverEnv;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly bus: number;
  private readonly i2cMasterDev: I2cMasterDev;
  private readonly poling: Poling = new Poling();
  private pollLastData: {[index: string]: Uint8Array} = {};

  constructor(props: EntityProps, env: DriverEnv, bus: string | number) {
    this.env = env;
    this.bus = (Number.isInteger(bus as any))
      ? bus as number
      : parseInt(bus as any);

    if (Number.isNaN(this.bus)) throw new Error(`Incorrect bus number "${this.bus}"`);

    const i2cDevDriver = this.env.getDriver<DriverFactoryBase>('I2cMaster.dev');

    this.i2cMasterDev = i2cDevDriver.getInstance(this.bus) as I2cMasterDev;
  }

  startPolling(i2cAddress: string | number, dataAddress: number | undefined, length: number): void {
    const addressHex: number = this.normilizeAddr(i2cAddress);
    const id = this.generateId(addressHex, dataAddress);

    // TODO: test

    if (this.poling.isInProgress(id)) {
      // TODO: если запущен то проверить длинну и ничего не делать
      // TODO: если длина не совпадает то не фатальная ошибка

      return;
    }

    const cbWhichPoll = (): Promise<void> => {
      return this.poll(addressHex, dataAddress, length);
    };

    // TODO: где взять poll interval ???
    this.poling.startPoling(cbWhichPoll, 1000, id);
  }

  startInt(i2cAddress: string | number, dataAddress: number | undefined, length: number, gpioInput: number) {

    // TODO: test

    const addressHex: number = this.normilizeAddr(i2cAddress);
    // TODO: запустить, если запущен то проверить длинну и ничего не делать
    // TODO: если длина не совпадает то не фатальная ошибка
  }

  listenIncome(
    i2cAddress: string | number,
    dataAddress: number | undefined,
    length: number,
    handler: Handler
  ): void {

    // TODO: если уже есть полинг/int - то проверять чтобы длина была та же иначе throw

    const addressHex: number = this.normilizeAddr(i2cAddress);
    const id = this.generateId(addressHex, dataAddress);

    // start poling/int if need
    this.startListen(addressHex, dataAddress, length);
    // listen to events of this address and dataAddress
    this.events.addListener(id, handler);
  }

  removeListener(
    i2cAddress: string | number,
    dataAddress: number | undefined,
    handler: Handler
  ): void {

    // TODO: test

    const addressHex: number = this.normilizeAddr(i2cAddress);
    const id = this.generateId(addressHex, dataAddress);

    // TODO: останавливает полинг если уже нет ни одного слушателя

    this.events.removeListener(id, handler);
  }

  /**
   * Read data once and rise data event
   */
  async poll(i2cAddress: string | number, dataAddress: number | undefined, length: number): Promise<void> {
    const addressHex: number = this.normilizeAddr(i2cAddress);
    const id = this.generateId(addressHex, dataAddress);

    // TODO: проверить длинну - если есть полинг или листенеры - то должна соответствовать ????

    let data: Uint8Array;

    try {
      data = await this.read(addressHex, dataAddress, length);
    }
    catch (err) {
      this.events.emit(id, err);

      return;
    }

    // if data is equal to previous data - do nothing
    if (
      typeof this.pollLastData[id] !== 'undefined'
      && _isEqual(this.pollLastData[id], data)
    ) return;

    // save previous data
    this.pollLastData[id] = data;
    // finally rise an event
    this.events.emit(id, null, data);
  }

  /**
   * Write and read from the same data address.
   */
  async request(i2cAddress: string | number, dataAddress: number | undefined, dataToSend: Uint8Array, readLength: number): Promise<Uint8Array> {
    const addressHex: number = this.normilizeAddr(i2cAddress);

    await this.write(addressHex, dataAddress, dataToSend);

    return this.read(addressHex, dataAddress, readLength);
  }

  /**
   * Read once from bus.
   * If dataAddress is specified, it do request to data address(dataAddress) first.
   */
  async read(i2cAddress: string | number, dataAddress: number | undefined, length: number): Promise<Uint8Array> {
    const addressHex: number = this.normilizeAddr(i2cAddress);

    // write command
    if (typeof dataAddress !== 'undefined') {
      await this.writeEmpty(addressHex, dataAddress);
    }
    // read from bus
    return this.i2cMasterDev.readFrom(addressHex, length);
  }

  async write(i2cAddress: string | number, dataAddress: number | undefined, data: Uint8Array): Promise<void> {
    const addressHex: number = this.normilizeAddr(i2cAddress);
    let dataToWrite = data;

    if (typeof dataAddress !== 'undefined') {
      dataToWrite = addFirstItemUint8Arr(data, dataAddress);
    }

    await this.i2cMasterDev.writeTo(addressHex, dataToWrite);
  }

  /**
   * Write only a dataAddress to bus
   */
  writeEmpty(i2cAddress: string | number, dataAddress: number): Promise<void> {
    const addressHex: number = this.normilizeAddr(i2cAddress);
    const dataToWrite = new Uint8Array(REGISTER_LENGTH);

    dataToWrite[0] = dataAddress;

    return this.i2cMasterDev.writeTo(addressHex, dataToWrite);
  }


  private normilizeAddr(addressHex: string | number): number {
    return (Number.isInteger(addressHex as any))
      ? addressHex as number
      : hexStringToHexNum(addressHex as string);
  }

  private generateId(addressHex: number, dataAddress: number | undefined): string {
    return [ addressHex.toString(), dataAddress ].join('-');
  }

  private startListen(addressHex: number, dataAddress: number | undefined, length: number): void {
    // TODO: в соответсвии с конфигом запустить poling или int
    // TODO: если уже запущенно - ничего не делаем
    // TODO: если уже запущенно - и длинна не совпадает - ругаться в консоль
  }

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      props: EntityProps,
      env: DriverEnv,
      bus: string | number,
    ): I2cMasterDriver } = I2cMasterDriver;
  private instances: {[index: string]: I2cMasterDriver} = {};

  getInstance(bus: string) {

    // TODO: возвращать тип I2cMasterDriver
    // TODO: если есть инстанс наверное нужно возвращать его а не создавать новый - проверить в других драйверах

    this.instances[bus] = super.getInstance(bus) as I2cMasterDriver;

    return this.instances[bus];
  }
}
