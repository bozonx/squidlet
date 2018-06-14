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
  private readonly eventName: string = 'data';
  private readonly bus: number;
  private readonly i2cMasterDev: I2cMasterDev;

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
    // TODO: запустить, если запущен то проверить длинну и ничего не делать
    // TODO: если длина не совпадает то не фатальная ошибка
  }

  startInt(addrHex: string | number, register: number | undefined, length: number, gpioInput: number) {
    // TODO: запустить, если запущен то проверить длинну и ничего не делать
    // TODO: если длина не совпадает то не фатальная ошибка
  }

  async write(addrHex: string | number, register: number | undefined, data: Uint8Array): Promise<void> {

    // TODO: test

    const address = this.normilizeAddr(addrHex);
    let dataToSend = data;

    if (typeof register !== 'undefined') {
      dataToSend = new Uint8Array(data.length + REGISTER_LENGTH);
      dataToSend[REGISTER_POSITION] = register;
      data.forEach((item, index) => dataToSend[index + REGISTER_LENGTH] = item);
    }

    await this.i2cMasterDev.writeTo(address, data);
  }

  listen(addrHex: string | number, register: number | undefined, length: number, handler: (data: Uint8Array) => void): void {
    const address = this.normilizeAddr(addrHex);

    // TODO: может запустить polling если не был запущен ранее, а може ругаться ???

    // TODO: при полинге сохраняем последние данные и при новом значение - говорим что значение изменилось
    // TODO: если не указар register - то принимать все данные
    // TODO: публикуем пришедшие данные заданной длинны
    // TODO: при установке первого листенера - запускается полинг или слушается int
    // TODO: вешать на конкретный bus и address

    this.events.addListener(this.eventName, handler);
  }

  removeListener(addrHex: string | number, register: number | undefined, length: number, handler: (data: Uint8Array) => void): void {
    const address = this.normilizeAddr(addrHex);

    // TODO: останавливает полинг если уже нет ни одного слушателя
    // TODO: использовать bus и address

    this.events.removeListener(this.eventName, handler);
  }

  poll(addrHex: string | number, register: number | undefined, length: number): void {
    const address = this.normilizeAddr(addrHex);

    // TODO: послать запрос на регистр и ожидать ответ
    // TODO: разбираем ответ и поднимаем событие на геристр
  }

  request(addrHex: string | number, register: number, dataToSend: Uint8Array, readLength: number): Promise<Uint8Array> {
    const address = this.normilizeAddr(addrHex);

    // TODO: Write and read - но не давать никому встать в очередь
  }

  read(addrHex: string | number, register: number | undefined, length: number): Promise<Uint8Array> {
    const address = this.normilizeAddr(addrHex);

    // TODO: прочитать один раз данные заданной длинны
    // TODO: если есть register - сделать предварительный запрос
  }

  private normilizeAddr(address: string | number) {
    return (Number.isInteger(address as any))
      ? address as number
      : hexStringToHexNum(address as string);
  }

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      drivers: Drivers,
      driverParams: {[index: string]: any},
      bus: string,
    ): I2cMasterDriver } = I2cMasterDriver;
}
