import * as EventEmitter from 'events';
import App from '../app/App';
import I2cDriver from '../drivers/I2c.driver';
import Destination from '../app/interfaces/Destination';
import { uint8ArrayToString, stringToUint8Array } from '../helpers/helpers';


/**
 * It packs data to send it via i2c.
 */
export default class I2cTunnel {
  private readonly app: App;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly connectionTo: Destination;
  private readonly i2c: I2cDriver;
  private readonly eventName: string = 'data';
  // its "7E"
  private readonly tunnelDataAddr: number = 126;

  constructor(app: App, connectionTo: Destination) {
    this.app = app;
    this.connectionTo = connectionTo;
    this.i2c = this.app.drivers.getDriver('I2c');
  }

  init(): void {
    this.i2c.listenData(this.connectionTo.bus, this.connectionTo.address, this.tunnelDataAddr, this.handleIncomeData);
  }

  async publish(data: object): Promise<void> {
    const jsonString = JSON.stringify(data);
    const uint8Arr = stringToUint8Array(jsonString);

    await this.i2c.writeData(this.connectionTo.bus, this.connectionTo.address, this.tunnelDataAddr, uint8Arr);
  }

  subscribe(handler: (data: object) => void): void {
    this.events.addListener(this.eventName, handler);
  }

  unsubscribe(handler: (data: object) => void): void {
    this.events.removeListener(this.eventName, handler);
  }

  private handleIncomeData = (uint8Arr: Uint8Array): void => {
    const jsonString = uint8ArrayToString(uint8Arr);
    const data = JSON.parse(jsonString);

    this.events.emit(this.eventName, data);
  }

}
