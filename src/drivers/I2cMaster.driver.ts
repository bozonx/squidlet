import * as _ from 'lodash';
import * as EventEmitter from 'events';

import DriverFactoryBase from '../app/DriverFactoryBase';
import { I2cMasterDev } from '../dev/I2cMaster.dev';
import { hexStringToHexNum } from '../helpers/helpers';
import Drivers from '../app/Drivers';
import Poling from '../helpers/Poling';


const REGISTER_POSITION = 0;
const REGISTER_LENGTH = 1;


export class I2cMasterDriver {
  private readonly drivers: Drivers;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly bus: number;
  private readonly i2cMasterDev: I2cMasterDev;
  private readonly poling: Poling;
  private pollLastData: {[index: string]: Uint8Array} = {};

  constructor(drivers: Drivers, driverParams: {[index: string]: any}, bus: string | number) {
    this.drivers = drivers;
    this.poling = new Poling();
    this.bus = (Number.isInteger(bus as any))
      ? bus as number
      : parseInt(bus as any);

    if (Number.isNaN(this.bus)) throw new Error(`Incorrect bus number "${this.bus}"`);

    const i2cDevDriver: DriverFactoryBase = this.drivers.getDriver('I2cMaster.dev');

    this.i2cMasterDev = i2cDevDriver.getInstance(this.bus) as I2cMasterDev;
  }

  startPolling(addrHex: string | number, register: number | undefined, length: number): void {
    const address = this.normilizeAddr(addrHex);
    const id = this.generateId(address, register);

    // TODO: test

    if (this.poling.isInProgress(id)) {
      // TODO: если запущен то проверить длинну и ничего не делать
      // TODO: если длина не совпадает то не фатальная ошибка

      return;
    }

    const cbWhichPoll = (): Promise<void> => {
      return this.poll(address, register, length);
    };

    // TODO: где взять poll interval ???
    this.poling.startPoling(cbWhichPoll, 1000, id);
  }

  startInt(addrHex: string | number, register: number | undefined, length: number, gpioInput: number) {

    // TODO: test

    const address = this.normilizeAddr(addrHex);
    // TODO: запустить, если запущен то проверить длинну и ничего не делать
    // TODO: если длина не совпадает то не фатальная ошибка
  }

  listenIncome(addrHex: string | number, register: number | undefined, length: number, handler: (data: Uint8Array) => void): void {

    // TODO: если уже есть полинг/int - то проверять чтобы длина была та же иначе throw

    const address = this.normilizeAddr(addrHex);
    const id = this.generateId(address, register);

    // start poling/int if need
    this.startListen(address, register, length);
    // listen to events of this address and register
    this.events.addListener(id, handler);
  }

  removeListener(addrHex: string | number, register: number | undefined, length: number, handler: (data: Uint8Array) => void): void {

    // TODO: test

    const address = this.normilizeAddr(addrHex);
    const id = this.generateId(address, register);

    // TODO: length наверное не нужен
    // TODO: останавливает полинг если уже нет ни одного слушателя

    this.events.removeListener(id, handler);
  }

  /**
   * Read data once and rise data event
   */
  async poll(addrHex: string | number, register: number | undefined, length: number): Promise<void> {
    const address = this.normilizeAddr(addrHex);
    const id = this.generateId(address, register);

    // TODO: проверить длинну - если есть полинг или листенеры - то должна соответствовать ????

    const data: Uint8Array = await this.read(address, register, length);

    // if data is equal to previous data - do nothing
    if (
      typeof this.pollLastData[id] !== 'undefined'
      && _.isEqual(this.pollLastData[id], data)
    ) return;

    // save previous data
    this.pollLastData[id] = data;
    // finally rise an event
    this.events.emit(id, data);
  }

  /**
   * Write and read from the same data address.
   */
  async request(addrHex: string | number, register: number | undefined, dataToSend: Uint8Array, readLength: number): Promise<Uint8Array> {
    const address = this.normilizeAddr(addrHex);

    await this.write(address, register, dataToSend);

    return this.read(address, register, readLength);
  }

  /**
   * Read once from bus.
   * If register is specified, it do request to data address(register) first.
   */
  async read(addrHex: string | number, register: number | undefined, length: number): Promise<Uint8Array> {
    const address = this.normilizeAddr(addrHex);

    if (typeof register !== 'undefined') {
      await this.writeEmpty(address, register);
    }

    return this.i2cMasterDev.readFrom(address, length);
  }

  async write(addrHex: string | number, register: number | undefined, data: Uint8Array): Promise<void> {
    const address = this.normilizeAddr(addrHex);
    let dataToWrite = data;

    if (typeof register !== 'undefined') {
      dataToWrite = new Uint8Array(data.length + REGISTER_LENGTH);
      dataToWrite[REGISTER_POSITION] = register;
      data.forEach((item, index) => dataToWrite[index + REGISTER_LENGTH] = item);
    }

    await this.i2cMasterDev.writeTo(address, dataToWrite);
  }

  /**
   * Write only a register to bus
   */
  writeEmpty(addrHex: string | number, register: number): Promise<void> {
    const address = this.normilizeAddr(addrHex);
    const dataToWrite = new Uint8Array(REGISTER_LENGTH);

    dataToWrite[0] = register;

    return this.i2cMasterDev.writeTo(address, dataToWrite);
  }


  private normilizeAddr(address: string | number) {
    return (Number.isInteger(address as any))
      ? address as number
      : hexStringToHexNum(address as string);
  }

  private generateId(address: number, register: number | undefined): string {
    return [ address.toString(), register ].join('-');
  }

  private startListen(address: number, register: number | undefined, length: number): void {
    // TODO: в соответсвии с конфигом запустить poling или int
    // TODO: если уже запущенно - ничего не делаем
    // TODO: если уже запущенно - и длинна не совпадает - ругаться в консоль
  }

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      drivers: Drivers,
      driverParams: {[index: string]: any},
      bus: string,
    ): I2cMasterDriver } = I2cMasterDriver;
  private instances: {[index: string]: I2cMasterDriver} = {};

  getInstance(bus: string) {
    this.instances[bus] = super.getInstance(bus) as I2cMasterDriver;

    return this.instances[bus];
  }
}
