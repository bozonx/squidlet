import * as EventEmitter from 'events';
import App from '../app/App';
import Message from '../app/interfaces/Message';
import Destination from '../app/interfaces/Destination';


export default class LocalTunnel {
  private readonly _app: App;
  private readonly _events: EventEmitter = new EventEmitter();

  constructor(app: App, connection: Destination) {
    this._app = app;
  }

  init(): void {
  }

  async publish(message: Message): Promise<void> {
    this._events.emit('message', message);
  }

  subscribe(handler: (message: Message) => void): void {
    this._events.addListener('message', handler);
  }

  unsubscribe(handler: (message: Message) => void): void {
    this._events.removeListener('message', handler);
  }

}
