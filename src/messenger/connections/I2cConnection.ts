import * as EventEmitter from 'events';
import Drivers from "../../app/Drivers";
import I2cData from '../../drivers/I2cData.driver';
import { uint8ArrayToString, stringToUint8Array } from '../../helpers/helpers';


/**
 * It packs data to send it via i2c.
 */
export default class I2cConnection {
  private readonly drivers: Drivers;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly connectionTo: { type: string, bus: string };
  private readonly i2cDataDriver: I2cData;
  private readonly eventName: string = 'data';

  constructor(drivers: Drivers, connectionParams: { type: string, bus: string }) {
    this.drivers = drivers;
    this.connectionTo = connectionTo;
    this.i2cDataDriver = this.drivers.getDriver('I2cData');
  }

  init(): void {

    // TODO: походу над слушать конкретный адрес

    //this.i2cDataDriver.listen(this.connectionTo.bus, this.connectionTo.address, this.handleIncomeData);
  }

  async send(address: string, payload: any): Promise<void> {
    const jsonString = JSON.stringify(payload);
    const uint8Arr = stringToUint8Array(jsonString);

    await this.i2cDataDriver.write(this.connectionTo.bus, address, uint8Arr);
  }

  listenIncome(address: string, handler: (payload: any) => void): void {
    this.events.addListener(this.eventName, handler);
  }

  off(handler: (payload: any) => void): void {
    this.events.removeListener(this.eventName, handler);
  }

  private handleIncomeData = (uint8Arr: Uint8Array): void => {
    const jsonString = uint8ArrayToString(uint8Arr);
    const data = JSON.parse(jsonString);

    this.events.emit(this.eventName, data);
  }

}
