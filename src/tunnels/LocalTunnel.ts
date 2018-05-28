import * as EventEmitter from 'events';
import App from '../app/App';
import MessageInterface from '../app/interfaces/MessageInterface';
import AddressInterface from '../app/interfaces/AddressInterface';


export default class LocalTunnel {
  private readonly app: App;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(app: App, connection: AddressInterface) {
    this.app = app;
  }

  async publish(message: MessageInterface): Promise<void> {
    this.events.emit('message', message);
  }

  subscribe(handler: (message: MessageInterface) => void): void {
    this.events.addListener('message', handler);
  }

  unsubscribe(handler: (message: MessageInterface) => void): void {
    this.events.removeListener('message', handler);
  }

}
