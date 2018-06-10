import * as EventEmitter from 'events';

import Drivers from '../app/Drivers';
import I2cDriver from './I2cMaster.driver';


export default class I2cSlaveDataDriver {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly drivers: Drivers;
  private readonly i2cDriver: I2cDriver;
  private readonly eventName: string = 'data';
  // its "7E"
  private readonly dataAddr: number = 126;

  constructor(drivers: Drivers) {
    this.drivers = drivers;
    this.i2cDriver = this.drivers.getDriver('I2c');
  }

  async send(address: string, payload: any): Promise<void> {
    // TODO: review
  }

  listenIncome(address: string, handler: (payload: any) => void): void {
    // TODO: review
  }

  removeListener(handler: (payload: any) => void): void {
    // TODO: review
  }

  // requestData(bus: string, address: string): Promise<Buffer> {
  //   // TODO: Write and read - но не давать никому встать в очередь
  // }

}
