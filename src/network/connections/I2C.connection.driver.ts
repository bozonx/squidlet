import * as EventEmitter from 'events';

import Drivers from '../../app/Drivers';
import MyAddress from '../../app/interfaces/MyAddress';
import I2cDataDriver, { DriverInstance as I2cDataDriverInstance, I2cDriver } from '../../drivers/I2cData.driver';
import { uint8ArrayToString, stringToUint8Array } from '../../helpers/helpers';


/**
 * Instance for each address.
 * It works as master or slave according to address
 * It packs data to send it via i2c.
 */
export class DriverInstance {
  private readonly drivers: Drivers;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly driverConfig: {[index: string]: any};
  private readonly myAddress: MyAddress;
  private readonly eventName: string = 'data';
  private readonly i2cDataDriver: I2cDataDriverInstance;
  // register of this driver's data
  private readonly dataMark: number = 0x01;

  constructor(drivers: Drivers, driverConfig: {[index: string]: any}, myAddress: MyAddress) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
    this.myAddress = myAddress;

    const isMaster = typeof this.myAddress === 'undefined';
    const dataDriver: I2cDataDriver = this.drivers.getDriver('I2cData.driver');
    const i2cDriverName = (isMaster) ? 'I2cMaster.driver' : 'I2cSlave.driver';
    // get low level i2c driver
    const i2cDriver: I2cDriver = this.drivers.getDriver(i2cDriverName) as I2cDriver;

    this.i2cDataDriver = dataDriver.getInstance(i2cDriver, this.myAddress.bus, this.myAddress.address);
  }

  init() {
    this.i2cDataDriver.listenIncome(this.dataMark, this.handleIncomeData);
  }

  async send(payload: any): Promise<void> {
    const jsonString = JSON.stringify(payload);
    const uint8Arr = stringToUint8Array(jsonString);

    await this.i2cDataDriver.send(this.dataMark, uint8Arr);
  }

  listenIncome(handler: (payload: any) => void): void {
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
