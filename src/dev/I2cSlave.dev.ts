import * as i2cBusModule from 'i2c-bus';
import DriverFactoryBase from '../app/DriverFactoryBase';
import Drivers from '../app/Drivers';


export class I2cSlaveDev {
  private readonly bus: i2cBusModule.I2cBus;

  constructor(drivers: Drivers, driverParams: {[index: string]: any}, bus: number) {
    this.bus = i2cBusModule.openSync(Number(bus));
  }

  async write(data: Uint8Array): Promise<void> {
    // TODO: !!!!
  }

  listenIncome(handler: (data: Uint8Array) => void): void {
    // TODO: !!!!
  }

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      drivers: Drivers,
      driverParams: {[index: string]: any},
      bus: number
    ): I2cSlaveDev } = I2cSlaveDev;
}
