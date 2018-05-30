import * as EventEmitter from 'events';
import App from '../app/App';
import I2c from '../drivers/I2c';
import AddressInterface from '../app/interfaces/AddressInterface';
import { uint8ArrayToString, stringToUint8Array } from '../helpers/helpers';


export default class I2cTunnel {
  private readonly app: App;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly connectionTo: AddressInterface;
  private readonly i2c: I2c;
  private readonly eventName: 'data';
  // its "7E"
  private readonly tunnelDataAddr: number = 126;

  constructor(app: App, connectionTo: AddressInterface) {
    this.app = app;
    this.connectionTo = connectionTo;
    this.i2c = this.app.drivers.getDriver('I2c');
  }

  init() {
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
