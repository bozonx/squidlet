import * as EventEmitter from 'events';
import App from '../app/App';
import MessageInterface from '../app/interfaces/MessageInterface';
import DestinationInterface from '../app/interfaces/DestinationInterface';


export default class LocalTunnel {
  private readonly _app: App;
  private readonly _events: EventEmitter = new EventEmitter();

  constructor(app: App, connection: DestinationInterface) {
    this._app = app;
  }

  init() {
  }

  async publish(message: MessageInterface): Promise<void> {
    this._events.emit('message', message);
  }

  subscribe(handler: (message: MessageInterface) => void): void {
    this._events.addListener('message', handler);
  }

  unsubscribe(handler: (message: MessageInterface) => void): void {
    this._events.removeListener('message', handler);
  }

}
