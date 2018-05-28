import App from '../app/App';
import MessageInterface from '../app/interfaces/MessageInterface';
import AddressInterface from '../app/interfaces/AddressInterface';


export default class LocalTunnel {
  private readonly app: App;
  private readonly connection: AddressInterface;

  constructor(app: App, connection: AddressInterface) {
    this.app = app;
    this.connection = connection;
  }

  async publish(message: MessageInterface): Promise<void> {
    // TODO: !!!!
  }

  subscribe(handler: (message: MessageInterface) => void): void {
    // TODO: !!!!
  }

  unsubscribe(handler: (message: MessageInterface) => void): void {
    // TODO: !!!!
  }

}
