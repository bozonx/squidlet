import * as EventEmitter from 'events';

import Drivers from '../app/Drivers';
import I2cSlave, { DriverInstance as I2cSlaveInstance } from './I2cSlave.driver';
import MyAddress from '../app/interfaces/MyAddress';
import I2cMaster from './I2cMaster.driver';


export class DriverInstance {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly drivers: Drivers;
  private readonly driverConfig: {[index: string]: any};
  private readonly myAddress: MyAddress;
  private readonly eventName: string = 'data';
  private readonly i2cDriver: I2cSlaveInstance;

  constructor(drivers: Drivers, driverConfig: {[index: string]: any}, myAddress: MyAddress) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
    this.myAddress = myAddress;

    const driver: I2cSlave = this.drivers.getDriver('I2cSlave');
    this.i2cDriver = driver.getInstance(this.myAddress.bus, this.myAddress.address);
  }

  async send(address: string, payload: Uint8Array): Promise<void> {
    // TODO: review
  }

  listenIncome(address: string, handler: (payload: Uint8Array) => void): void {
    // TODO: review
  }

  removeListener(handler: (payload: Uint8Array) => void): void {
    // TODO: review
  }

  // requestData(bus: string, address: string): Promise<Buffer> {
  //   // TODO: Write and read - но не давать никому встать в очередь
  // }

}


export default class I2cSlaveDataDriver {
  private readonly drivers: Drivers;
  private readonly driverConfig: {[index: string]: any};

  constructor(drivers: Drivers, driverConfig: {[index: string]: any} = {}) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
  }

  getInstance(myAddress: MyAddress) {
    return new DriverInstance(this.drivers, this.driverConfig, myAddress);
  }

}
