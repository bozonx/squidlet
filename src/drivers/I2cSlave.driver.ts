import * as EventEmitter from 'events';

import { I2cSlaveDev } from '../dev/I2cSlave.dev';
import Drivers from '../app/Drivers';
import DriverFactoryBase from '../app/DriverFactoryBase';
import { addFirstItemUint8Arr, withoutFirstItemUnit8Arr } from '../helpers/helpers';


const NO_DATA_ADDRESS = 'null';

type SlaveHandler = (error: Error | null, data?: Uint8Array) => void;


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

    const i2cSlaveDev = this.drivers.getDriver('I2cSlave.dev') as DriverFactoryBase;

    this.i2cSlaveDev = i2cSlaveDev.getInstance(this.bus) as I2cSlaveDev;
    // listen all the income data
    this.i2cSlaveDev.listenIncome(this.handleIncomeData);
  }

  // TODO: поддержка int

  async write(i2cAddress: undefined, dataAddress: number | undefined, data: Uint8Array): Promise<void> {
    let dataToWrite = data;

    if (typeof dataAddress !== 'undefined') {
      dataToWrite = addFirstItemUint8Arr(data, dataAddress);
    }

    this.i2cSlaveDev.send(dataToWrite);

    // TODO: test

    // TODO: !!!! ??? сделать очередь чтобы мастер считал при полинге
    // TODO: !!!! ??? последние данные будут удаляться или висеть ???
  }

  async read(i2cAddress: undefined, dataAddress: number | undefined, length: number): Promise<Uint8Array> {

    // TODO: test

    // TODO: может повешаться на listenIncome и ждать dataAddress и потом отписаться ???

  }

  listenIncome(
    i2cAddress: undefined,
    dataAddress: number | undefined,
    length: number,
    handler: SlaveHandler
  ): void {

    // TODO: test

    const id = this.generateId(dataAddress);

    this.events.addListener(id, handler);
  }

  removeListener(
    i2cAddress: undefined,
    dataAddress: number | undefined,
    length: number,
    handler: SlaveHandler
  ): void {

    // TODO: test

    const id = this.generateId(dataAddress);

    this.events.removeListener(id, handler);
  }

  private handleIncomeData = (data: Uint8Array) => {

    // TODO: test

    // emit handler for all the income data any way
    this.events.emit(NO_DATA_ADDRESS, null, data);

    // emit handler of data address
    if (data.length) {
      this.events.emit(data[0].toString(), null, withoutFirstItemUnit8Arr(data));
    }
  }

  private generateId(dataAddress: number | undefined): string {
    if (typeof dataAddress === 'undefined') return NO_DATA_ADDRESS;

    return dataAddress.toString();
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
