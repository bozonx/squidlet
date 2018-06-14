import * as EventEmitter from 'events';

import DriverFactoryBase from '../app/DriverFactoryBase';
import I2cMasterDev from '../dev/I2cMaster.dev';
import { hexStringToHexNum } from '../helpers/helpers';
import Drivers from '../app/Drivers';
import MyAddress from '../app/interfaces/MyAddress';

// TODO: сделать поддержку poling
// TODO: сделать поддержку int

const REGISTER_POSITION = 0;
const REGISTER_LENGTH = 1;


export class I2cMasterDriverClass {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly eventName: string = 'data';
  private readonly bus: number;
  private readonly address: number;
  private readonly i2cMasterDev: I2cMasterDev;

  constructor(drivers: Drivers, driverParams: {[index: string]: any}, bus: string, address: string) {
    this.bus = parseInt(bus);
    this.address = hexStringToHexNum(address);

    if (Number.isNaN(this.bus)) throw new Error(`Incorrect bus number "${this.bus}"`);

    this.i2cMasterDev = new I2cMasterDev(this.bus);
  }

  async write(register: number | undefined, data: Uint8Array): Promise<void> {

    // TODO: test

    let dataToSend = data;

    if (typeof register !== 'undefined') {
      dataToSend = new Uint8Array(data.length + REGISTER_LENGTH);
      dataToSend[REGISTER_POSITION] = register;
      data.forEach((item, index) => dataToSend[index + REGISTER_LENGTH] = item);
    }

    await this.i2cMasterDev.writeTo(this.address, data);
  }

  listen(register: number | undefined, length: number, handler: (data: Uint8Array) => void): void {
    // TODO: при полинге сохраняем последние данные и при новом значение - говорим что значение изменилось
    // TODO: если не указар register - то принимать все данные
    // TODO: публикуем пришедшие данные заданной длинны
    // TODO: при установке первого листенера - запускается полинг или слушается int
    // TODO: вешать на конкретный bus и address

    this.events.removeListener(this.eventName, handler);
  }

  removeListener(register: number | undefined, length: number, handler: (data: Uint8Array) => void): void {

    // TODO: использовать bus и address

    this.events.removeListener(this.eventName, handler);
  }


  read(bus: string, address: string, length: number): Promise<Uint8Array> {
    // TODO: прочитать один раз данные - только для мастера
  }

  // request(bus: string, address: string, dataAddr: number, data: Buffer): Promise<Buffer> {
  //   // Write and read - но не давать никому встать в очередь
  // }

}


export default class I2cMasterDriver extends DriverFactoryBase {
  DriverClass: { new (
      drivers: Drivers,
      driverParams: {[index: string]: any},
      bus: string,
      address: string
    ): I2cMasterDriverClass } = I2cMasterDriverClass;
}
