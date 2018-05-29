import App from '../app/App';
import I2c from '../drivers/I2c';
import MessageInterface from '../app/interfaces/MessageInterface';
import AddressInterface from '../app/interfaces/AddressInterface';


export default class I2cTunnel {
  private readonly app: App;
  private readonly connection: AddressInterface;
  private readonly i2c: I2c;
  // its "7E"
  private readonly tunnelDataAddr: 126;

  constructor(app: App, connection: AddressInterface) {
    this.app = app;
    this.connection = connection;
    this.i2c = this.app.drivers.getDriver('I2c');
  }

  async publish(message: MessageInterface): Promise<void> {
    const jsonString = JSON.stringify(message);
    const buffer = new Buffer(jsonString, 'utf8');
    await this.i2c.writeData(this.connection.bus, this.connection.address, this.tunnelDataAddr, buffer);
  }

  subscribe(handler: (message: MessageInterface) => void): void {
    const callback = (data: Buffer) => {

      // TODO: review - может лучше toString() использовать ???

      const jsonString = data.toJSON().data.join();
      const message: MessageInterface = JSON.parse(jsonString);

      handler(message);
    };

    this.i2c.listenData(this.connection.bus, this.connection.address, this.tunnelDataAddr, callback);
  }

  unsubscribe(handler: (message: MessageInterface) => void): void {
    // TODO: !!!!

    // TODO: наверное все через события сделать. А вешаться i2c при инициализации

  }

}
