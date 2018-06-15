import * as EventEmitter from 'events';

import I2cSlaveDev from '../dev/I2cSlave.dev';
import Drivers from '../app/Drivers';
import DriverFactoryBase from '../app/DriverFactoryBase';
import { hexStringToHexNum } from '../helpers/helpers';

// TODO: сделать поддержку poling
// TODO: сделать поддержку int


export class I2cSlaveDriver {
  private readonly drivers: Drivers;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly bus: number;
  private readonly i2cSlaveDev: I2cSlaveDev;

  constructor(drivers: Drivers, driverParams: {[index: string]: any}, bus: string | number) {
    this.drivers = drivers;
    this.bus = (Number.isInteger(bus as any))
      ? bus as number
      : parseInt(bus as any);

    if (Number.isNaN(this.bus)) throw new Error(`Incorrect bus number "${this.bus}"`);

    const i2cSlaveDev: DriverFactoryBase = this.drivers.getDriver('I2cSlave.dev');

    this.i2cSlaveDev = i2cSlaveDev.getInstance(this.bus) as I2cSlaveDev;

    // TODO: повешать слушателя handleIncomeData прерываний i2c
  }

  // TODO: поддержка int

  async write(i2cAddress: string | number, dataAddress: number | undefined, data: Uint8Array): Promise<void> {

    // TODO: test

    // TODO: !!!! выставить данные чтобы мастер их считал
    // TODO: !!!! сделать очередь чтобы мастер считал при полинге
    // TODO: !!!! ??? последние данные будут удаляться или висеть ???
  }

  listenIncome(
    i2cAddress: string | number,
    dataAddress: number | undefined,
    length: number,
    handler: (data: Uint8Array) => void
  ): void {

    // TODO: test

    const addressHex = this.normilizeAddr(i2cAddress);
    const id = this.generateId(addressHex, dataAddress);

    this.events.addListener(id, handler);

    // TODO: если не указар dataAddress - то принимать все данные
  }

  removeListener(
    i2cAddress: string | number,
    dataAddress: number | undefined,
    length: number,
    handler: (data: Uint8Array) => void
  ): void {

    // TODO: test

    const addressHex = this.normilizeAddr(i2cAddress);
    const id = this.generateId(addressHex, dataAddress);

    this.events.removeListener(id, handler);
  }

  private handleIncomeData(data: Uint8Array) {

    // TODO: test

    // TODO: поднять событие на слушателе без регистра и на регистре - 1й байт
  }

  private normilizeAddr(addressHex: string | number) {
    return (Number.isInteger(addressHex as any))
      ? addressHex as number
      : hexStringToHexNum(addressHex as string);
  }

  private generateId(addressHex: number, dataAddress: number | undefined): string {
    return [ addressHex.toString(), dataAddress ].join('-');
  }

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      drivers: Drivers,
      driverParams: {[index: string]: any},
      bus: string | number,
    ): I2cSlaveDriver } = I2cSlaveDriver;
  private instances: {[index: string]: I2cSlaveDriver} = {};

  getInstance(bus: string) {
    this.instances[bus] = super.getInstance(bus) as I2cSlaveDriver;

    return this.instances[bus];
  }
}
