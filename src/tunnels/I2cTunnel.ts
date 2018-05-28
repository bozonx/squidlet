import App from '../app/App';
import App from '../app/App';
import MessageInterface from '../app/interfaces/MessageInterface';
import AddressInterface from '../app/interfaces/AddressInterface';


export default class I2cTunnel {
  private readonly app: App;
  private readonly driver: App;
  private readonly connection: AddressInterface;

  constructor(app: App, connection: AddressInterface) {
    this.app = app;
    this.connection = connection;
  }

  async publish(message: MessageInterface): Promise<void> {

  }

  subscribe(handler: (message: MessageInterface) => void): void {

  }

  unsubscribe(handler: (message: MessageInterface) => void): void {
    // TODO: !!!!
  }

}
