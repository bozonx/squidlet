import * as EventEmitter from 'events';
import App from '../app/App';
import I2c from '../drivers/I2c';
import MessageInterface from '../app/interfaces/MessageInterface';
import AddressInterface from '../app/interfaces/AddressInterface';
import { Uint8ArrayToString, StringToUint8Array } from '../helpers/helpers';


export default class I2cTunnel {
  private readonly app: App;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly connection: AddressInterface;
  private readonly i2c: I2c;
  private readonly eventName: 'data';
  // its "7E"
  private readonly tunnelDataAddr: 126;

  constructor(app: App, connection: AddressInterface) {
    this.app = app;
    this.connection = connection;
    this.i2c = this.app.drivers.getDriver('I2c');

    this.i2c.listenData(this.connection.bus, this.connection.address, this.tunnelDataAddr, this.handleIncomeData);
  }

  async publish(message: MessageInterface): Promise<void> {
    const jsonString = JSON.stringify(message);
    const buffer = new Buffer(jsonString, 'utf8');

    // TODO: !!!! use Uint8Array

    await this.i2c.writeData(this.connection.bus, this.connection.address, this.tunnelDataAddr, buffer);
  }

  subscribe(handler: (message: MessageInterface) => void): void {
    this.events.addListener(this.eventName, handler);
  }

  unsubscribe(handler: (message: MessageInterface) => void): void {
    this.events.removeListener(this.eventName, handler);
  }

  private handleIncomeData = (data: Uint8Array): void => {
    // TODO: перевести обратно в string

    const result = '';

    // TODO: review - может лучше toString() использовать ???

    const jsonString = data.toJSON().data.join();
    const message: MessageInterface = JSON.parse(jsonString);


    this.events.emit(this.eventName, result);
  }

}
