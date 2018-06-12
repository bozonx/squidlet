import * as EventEmitter from 'events';

import Drivers from '../../app/Drivers';
import MyAddress from '../../app/interfaces/MyAddress';
import { uint8ArrayToString, stringToUint8Array } from '../../helpers/helpers';


interface I2cDataDriver {
  send: (
    bus: string,
    address: string,
    register: number | undefined,
    data: Uint8Array
  ) => Promise<void>;
  listenIncome: (
    bus: string,
    address: string,
    register: number | undefined,
    handler: (data: Uint8Array) => void
  ) => void;
  removeListener: (
    bus: string,
    address: string,
    register: number | undefined,
    handler: (data: Uint8Array) => void
  ) => void;
}

/**
 * Instance for each address.
 * It works as master or slave according to address
 * It packs data to send it via i2c.
 */
class DriverInstance {
  private readonly drivers: Drivers;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly driverConfig: {[index: string]: any};
  private readonly myAddress: MyAddress;
  private readonly eventName: string = 'data';
  private readonly i2cDataDriver: I2cDataDriver;
  // register of this driver's data
  private readonly register: number = 0x1a;

  constructor(drivers: Drivers, driverConfig: {[index: string]: any}, myAddress: MyAddress) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
    this.myAddress = myAddress;
    const isMaster = typeof this.myAddress === 'undefined';

    if (isMaster) {
      // use master driver
      this.i2cDataDriver = this.drivers.getDriver('I2cMasterData.driver') as I2cDataDriver;
    }
    else {
      // use slave driver
      this.i2cDataDriver = this.drivers.getDriver('I2cSlaveData.driver') as I2cDataDriver;
    }
  }

  init() {
    this.i2cDataDriver.listenIncome(
      this.myAddress.bus,
      this.myAddress.address,
      this.register,
      this.handleIncomeData
    );
  }

  async send(address: string, payload: any): Promise<void> {
    const jsonString = JSON.stringify(payload);
    const uint8Arr = stringToUint8Array(jsonString);

    await this.i2cDataDriver.send(this.myAddress.bus, address, this.register, uint8Arr);
  }

  listenIncome(address: string, handler: (payload: any) => void): void {
    this.events.addListener(this.eventName, handler);
  }

  removeListener(handler: (payload: any) => void): void {
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
