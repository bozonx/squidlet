import * as EventEmitter from 'events';

import Drivers from '../../app/Drivers';
import MyAddress from '../../app/interfaces/MyAddress';
import DriverFactoryBase from '../../app/DriverFactoryBase';
import { I2cDataDriver, I2cDriverClass } from '../../drivers/I2cData.driver';
import { uint8ArrayToText, textToUint8Array } from '../../helpers/helpers';


/**
 * Instance for each address.
 * It works as master or slave according to address
 * It packs data to send it via i2c.
 */
export class I2CConnectionDriver {
  private readonly drivers: Drivers;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly driverConfig: {[index: string]: any};
  private readonly myAddress: MyAddress;
  private readonly eventName: string = 'data';
  private readonly i2cDataDriver: I2cDataDriver;
  // dataAddress of this driver's data
  private readonly dataMark: number = 0x01;

  constructor(drivers: Drivers, driverConfig: {[index: string]: any}, myAddress: MyAddress) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
    this.myAddress = myAddress;

    const isMaster = typeof this.myAddress.address === 'undefined';
    const dataDriver: DriverFactoryBase = this.drivers.getDriver('I2cData.driver');
    const i2cDriverName = (isMaster) ? 'I2cMaster.driver' : 'I2cSlave.driver';
    // get low level i2c driver
    const i2cDriver: I2cDriverClass = this.drivers.getDriver(i2cDriverName) as I2cDriverClass;

    this.i2cDataDriver = dataDriver.getInstance(i2cDriver, this.myAddress.bus, this.myAddress.address) as I2cDataDriver;
  }

  init() {
    this.i2cDataDriver.listenIncome(this.dataMark, this.handleIncomeData);
  }

  async send(address: string, payload: any): Promise<void> {
    const jsonString = JSON.stringify(payload);
    const uint8Arr = textToUint8Array(jsonString);

    await this.i2cDataDriver.send(this.dataMark, uint8Arr);
  }

  listenIncome(address: string, handler: (payload: any) => void): void {
    this.events.addListener(this.eventName, handler);
  }

  removeListener(address: string, handler: (payload: any) => void): void {
    this.events.removeListener(this.eventName, handler);
  }

  private handleIncomeData = (uint8Arr: Uint8Array): void => {
    const jsonString = uint8ArrayToText(uint8Arr);
    const data = JSON.parse(jsonString);

    this.events.emit(this.eventName, data);
  }

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      drivers: Drivers,
      driverParams: {[index: string]: any},
      myAddress: MyAddress,
    ): I2CConnectionDriver } = I2CConnectionDriver;
}
