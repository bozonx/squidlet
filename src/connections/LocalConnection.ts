import * as EventEmitter from 'events';
import App from '../app/App';
import Message from '../app/interfaces/Message';
import Destination from '../app/interfaces/Destination';


export default class LocalConnection {
  private readonly app: App;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(app: App, connection: Destination) {
    this.app = app;
  }

  init(): void {
  }

  async publish(message: Message): Promise<void> {
    this.events.emit('message', message);
  }

  subscribe(handler: (message: Message) => void): void {
    this.events.addListener('message', handler);
  }

  unsubscribe(handler: (message: Message) => void): void {
    this.events.removeListener('message', handler);
  }

}
