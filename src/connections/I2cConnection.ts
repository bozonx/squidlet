import * as EventEmitter from 'events';
import App from '../app/App';
import I2cData from '../drivers/I2cData.driver';
import Destination from '../app/interfaces/Destination';
import { uint8ArrayToString, stringToUint8Array } from '../helpers/helpers';


/**
 * It packs data to send it via i2c.
 */
export default class I2cConnection {
  private readonly app: App;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly connectionTo: Destination;
  private readonly i2cDataDriver: I2cData;
  private readonly eventName: string = 'data';

  constructor(app: App, connectionTo: Destination) {
    this.app = app;
    this.connectionTo = connectionTo;
    this.i2cDataDriver = this.app.drivers.getDriver('I2cData');
  }

  init(): void {
    this.i2cDataDriver.listen(this.connectionTo.bus, this.connectionTo.address, this.handleIncomeData);
  }

  async publish(payload: any): Promise<void> {
    const jsonString = JSON.stringify(payload);
    const uint8Arr = stringToUint8Array(jsonString);

    await this.i2cDataDriver.write(this.connectionTo.bus, this.connectionTo.address, uint8Arr);
  }

  subscribe(handler: (payload: any) => void): void {
    this.events.addListener(this.eventName, handler);
  }

  unsubscribe(handler: (payload: any) => void): void {
    this.events.removeListener(this.eventName, handler);
  }

  private handleIncomeData = (uint8Arr: Uint8Array): void => {
    const jsonString = uint8ArrayToString(uint8Arr);
    const data = JSON.parse(jsonString);

    this.events.emit(this.eventName, data);
  }

}
