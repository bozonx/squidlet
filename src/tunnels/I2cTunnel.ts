import * as EventEmitter from 'events';
import App from '../app/App';
import I2c from '../drivers/I2c';
import DestinationInterface from '../app/interfaces/DestinationInterface';
import { uint8ArrayToString, stringToUint8Array } from '../helpers/helpers';


/**
 * It packs data to send it via i2c.
 */
export default class I2cTunnel {
  private readonly _app: App;
  private readonly _events: EventEmitter = new EventEmitter();
  private readonly _connectionTo: DestinationInterface;
  private readonly _i2c: I2c;
  private readonly _eventName: string = 'data';
  // its "7E"
  private readonly _tunnelDataAddr: number = 126;

  constructor(app: App, connectionTo: DestinationInterface) {
    this._app = app;
    this._connectionTo = connectionTo;
    this._i2c = this._app.drivers.getDriver('I2c');
  }

  init(): void {
    this._i2c.listenData(this._connectionTo.bus, this._connectionTo.address, this._tunnelDataAddr, this._handleIncomeData);
  }

  async publish(data: object): Promise<void> {
    const jsonString = JSON.stringify(data);
    const uint8Arr = stringToUint8Array(jsonString);

    await this._i2c.writeData(this._connectionTo.bus, this._connectionTo.address, this._tunnelDataAddr, uint8Arr);
  }

  subscribe(handler: (data: object) => void): void {
    this._events.addListener(this._eventName, handler);
  }

  unsubscribe(handler: (data: object) => void): void {
    this._events.removeListener(this._eventName, handler);
  }

  private _handleIncomeData = (uint8Arr: Uint8Array): void => {
    const jsonString = uint8ArrayToString(uint8Arr);
    const data = JSON.parse(jsonString);

    this._events.emit(this._eventName, data);
  }

}
