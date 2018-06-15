import * as _ from 'lodash';
import * as EventEmitter from 'events';

import DriverFactoryBase from '../app/DriverFactoryBase';
import { I2cMasterDev } from '../dev/I2cMaster.dev';
import { hexStringToHexNum } from '../helpers/helpers';
import Drivers from '../app/Drivers';


// TODO: сделать поддержку poling
// TODO: сделать поддержку int

const REGISTER_POSITION = 0;
const REGISTER_LENGTH = 1;


export class I2cMasterDriver {
  private readonly drivers: Drivers;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly bus: number;
  private readonly i2cMasterDev: I2cMasterDev;
  private pollLastData: {[index: string]: Uint8Array} = {};

  constructor(drivers: Drivers, driverParams: {[index: string]: any}, bus: string | number) {
    this.drivers = drivers;
    this.bus = (Number.isInteger(bus as any))
      ? bus as number
      : parseInt(bus as any);

    if (Number.isNaN(this.bus)) throw new Error(`Incorrect bus number "${this.bus}"`);

    const i2cDevDriver: DriverFactoryBase = this.drivers.getDriver('I2cMaster.dev');

    this.i2cMasterDev = i2cDevDriver.getInstance(this.bus) as I2cMasterDev;
  }

  startPolling(addrHex: string | number, register: number | undefined, length: number): void {

    // TODO: test

    const address = this.normilizeAddr(addrHex);
    // TODO: запустить, если запущен то проверить длинну и ничего не делать
    // TODO: если длина не совпадает то не фатальная ошибка
  }

  startInt(addrHex: string | number, register: number | undefined, length: number, gpioInput: number) {

    // TODO: test

    const address = this.normilizeAddr(addrHex);
    // TODO: запустить, если запущен то проверить длинну и ничего не делать
    // TODO: если длина не совпадает то не фатальная ошибка
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

  listen(addrHex: string | number, register: number | undefined, length: number, handler: (data: Uint8Array) => void): void {

    // TODO: test

    const address = this.normilizeAddr(addrHex);
    const eventName = this.generateEventName(address, register);

    // start poling/int if need
    this.startListen(address, register, length);
    // listen to events of this address and register
    this.events.addListener(eventName, handler);
  }

  removeListener(addrHex: string | number, register: number | undefined, length: number, handler: (data: Uint8Array) => void): void {

    // TODO: test

    const address = this.normilizeAddr(addrHex);
    const eventName = this.generateEventName(address, register);

    // TODO: length наверное не нужен
    // TODO: останавливает полинг если уже нет ни одного слушателя

    this.events.removeListener(eventName, handler);
  }

  /**
   * Read data and rise data event
   */
  async poll(addrHex: string | number, register: number | undefined, length: number): Promise<void> {

    // TODO: test

    const address = this.normilizeAddr(addrHex);
    const eventName = this.generateEventName(address, register);

    // TODO: проверить длинну - если есть полинг - то должна соответствовать ????
    // TODO: сохранять последний результат чтобы определить изменились ли данные
    // TODO: если не указар register - то принимать все данные

    const data: Uint8Array = await this.read(address, register, length);

    // if data is equal to previous data - do nothing
    if (
      typeof this.pollLastData[eventName] !== 'undefined'
      && _.isEqual(this.pollLastData[eventName], data)
    ) return;

    // save previous data
    this.pollLastData[eventName] = data;
    // finally rise an event
    this.events.emit(eventName, data);
  }

  // async request(addrHex: string | number, register: number, dataToSend: Uint8Array, readLength: number): Promise<Uint8Array> {
  //
  //   // TODO: test
  //
  //   const address = this.normilizeAddr(addrHex);
  //
  //   // TODO: Write and read - но не давать никому встать в очередь
  // }

  /**
   * Read once from bus.
   * If register is specified, it do request to data address(register) first.
   */
  async read(addrHex: string | number, register: number | undefined, length: number): Promise<Uint8Array> {

    // TODO: test

    const address = this.normilizeAddr(addrHex);

    if (typeof register !== 'undefined') {
      await this.writeEmpty(address, register);
    }

    return this.i2cMasterDev.readFrom(address, length);
  }

  /**
   * Write only a register to bus
   */
  writeEmpty(addrHex: string | number, register: number): Promise<void> {

    // TODO: test

    const address = this.normilizeAddr(addrHex);
    const data = new Uint8Array(1);

    data[0] = register;

    return this.i2cMasterDev.writeTo(address, data);
  }

  private normilizeAddr(address: string | number) {
    return (Number.isInteger(address as any))
      ? address as number
      : hexStringToHexNum(address as string);
  }

  private generateEventName(address: number, register: number | undefined): string {
    // TODO: проверить что будет если нет регистра
    return [ address.toString(), register ].join('-');
  }

  private startListen(address: number, register: number | undefined, length: number): void {
    // TODO: в соответсвии с конфигом запустить poling или int
    // TODO: если уже запущенно - ничего не делаем
    // TODO: если уже запущенно - и длинна не совпадает - ругаться в консоль
  }

}


// TODO: может лучше запоминать инстанс на bus и выдавать тот же самый?

export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      drivers: Drivers,
      driverParams: {[index: string]: any},
      bus: string,
    ): I2cMasterDriver } = I2cMasterDriver;
}
