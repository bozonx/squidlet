import Drivers from '../../app/Drivers';
import MyAddress from '../../app/interfaces/MyAddress';
import DriverFactoryBase from '../../app/DriverFactoryBase';
import { I2cDataDriver, I2cDriverClass } from '../../drivers/I2cData.driver';
import { uint8ArrayToText, textToUint8Array } from '../../helpers/helpers';
import * as _ from 'lodash';


/**
 * Instance for each type of connection and bus and address of current host.
 * It works as master or slave according to address
 * It packs data to send it via i2c.
 */
export class I2CConnectionDriver {
  private readonly drivers: Drivers;
  private readonly driverConfig: {[index: string]: any};
  private readonly myAddress: MyAddress;
  private readonly i2cDataDriver: I2cDataDriver;
  // dataAddress of this driver's data
  private readonly dataMark: number = 0x01;
  private readonly handlers: {[index: string]: Array<{ handler: Function, wrapper: Function }>} = {};

  constructor(drivers: Drivers, driverConfig: {[index: string]: any}, myAddress: MyAddress) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
    this.myAddress = myAddress;

    const isMaster = typeof this.myAddress.address === 'undefined';
    const dataDriver: DriverFactoryBase = this.drivers.getDriver('I2cData.driver');
    const i2cDriverName = (isMaster) ? 'I2cMaster.driver' : 'I2cSlave.driver';
    // get low level i2c driver
    const i2cDriver: I2cDriverClass = this.drivers.getDriver(i2cDriverName) as I2cDriverClass;

    this.i2cDataDriver = dataDriver.getInstance(i2cDriver, this.myAddress.bus) as I2cDataDriver;
  }

  async send(remoteAddress: string, payload: any): Promise<void> {
    const jsonString = JSON.stringify(payload);
    const uint8Arr = textToUint8Array(jsonString);

    await this.i2cDataDriver.send(remoteAddress, this.dataMark, uint8Arr);
  }

  listenIncome(remoteAddress: string, handler: (payload: any) => void): void {
    const wrapper = (uint8Arr: Uint8Array): void => {
      const jsonString = uint8ArrayToText(uint8Arr);
      const data = JSON.parse(jsonString);

      handler(data);
    };

    if (!this.handlers[remoteAddress]) this.handlers[remoteAddress] = [];
    this.handlers[remoteAddress].push({
      wrapper,
      handler,
    });

    this.i2cDataDriver.listenIncome(remoteAddress, this.dataMark, wrapper);
  }

  removeListener(remoteAddress: string, handler: (payload: any) => void): void {
    const handlers = this.handlers[remoteAddress];
    const handlerIndex = _.findIndex(handlers, (item) => {
      return item.handler === handler;
    });

    if (handlerIndex < 0) throw new Error(`Can't find handler index of "${remoteAddress}"`);

    handlers.splice(handlerIndex, 1);

    // TODO: где сам remove listener

    if (!this.handlers[remoteAddress].length) {
      delete this.handlers[remoteAddress];
    }
  }

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      drivers: Drivers,
      driverParams: {[index: string]: any},
      myAddress: MyAddress,
    ): I2CConnectionDriver } = I2CConnectionDriver;
}
