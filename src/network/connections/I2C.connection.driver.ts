import * as EventEmitter from 'events';

import Drivers from '../../app/Drivers';
import MyAddress from '../../app/interfaces/MyAddress';
import { uint8ArrayToString, stringToUint8Array } from '../../helpers/helpers';
import I2cMasterDriver from '../../drivers/I2cMaster.driver';
import I2cSlaveDriver from '../../drivers/I2cSlave.driver';


interface i2cDriver {
  send: (bus: string, address: string, data: Uint8Array) => Promise<void>;
  listenIncome: (bus: string, address: string, length: number, handler: (data: Uint8Array) => void) => void;
  removeListener: (bus: string, address: string, handler: (data: Uint8Array) => void) => void;
}

/**
 * It packs data to send it via i2c.
 */
class DriverInstance {
  private readonly drivers: Drivers;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly driverConfig: {[index: string]: any};
  private readonly myAddress: MyAddress;
  private readonly eventName: string = 'data';
  private readonly isMaster: boolean;
  private readonly i2cDriver: i2cDriver;

  // TODO: use octal
  // register of reading from slave
  private readonly slaveReadRegister: number = 125;
  // register of writing to slave
  private readonly slaveWriteRegister: number = 126;

  constructor(drivers: Drivers, driverConfig: {[index: string]: any}, myAddress: MyAddress) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
    this.myAddress = myAddress;
    this.isMaster = typeof this.myAddress === 'undefined';

    if (this.isMaster) {
      // use master driver
      this.i2cDriver = this.drivers.getDriver('I2cMaster.driver') as i2cDriver;
    }
    else {
      // use slave driver
      this.i2cDriver = this.drivers.getDriver('I2cSlave.driver') as i2cDriver;
    }
  }

  async send(address: string, payload: any): Promise<void> {
    const jsonString = JSON.stringify(payload);
    const uint8Arr = stringToUint8Array(jsonString);

    // TODO: указать регистр

    await this.i2cDriver.send(this.myAddress.bus, address, uint8Arr);
  }

  listenIncome(address: string, handler: (payload: any) => void): void {

    // TODO: review

    // TODO: указать регистр

    // TODO: если мастер - считывать с this.slaveReadRegister

    this.events.addListener(this.eventName, handler);
  }

  removeListener(handler: (payload: any) => void): void {

    // TODO: review

    this.events.removeListener(this.eventName, handler);
  }

  private handleIncomeData = (uint8Arr: Uint8Array): void => {
    const jsonString = uint8ArrayToString(uint8Arr);
    const data = JSON.parse(jsonString);

    this.events.emit(this.eventName, data);
  }

}


export default class ConnectionI2cDriver {
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
