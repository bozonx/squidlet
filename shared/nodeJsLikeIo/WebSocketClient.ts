import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';

import WebSocketClientIo, {WebSocketClientProps, WsClientEvents} from 'system/interfaces/io/WebSocketClientIo';
import {isUint8Array} from 'system/helpers/collections';
import IndexedEventEmitter from 'system/helpers/IndexedEventEmitter';
import {AnyHandler} from 'system/helpers/IndexedEvents';


type ConnectionItem = [ WebSocket, IndexedEventEmitter<AnyHandler>, WebSocketClientProps ];

enum CONNECTION_POSITIONS {
  webSocket,
  events,
  props
}

const eventNames = {
  open: 'open',
  close: 'close',
  message: 'message',
  error: 'error',
};


export default class WebSocketClient implements WebSocketClientIo {
  // TODO: тоже должны идти по connection id
  //private readonly errorEvents = new IndexedEvents<(err: string) => void>();
  private readonly connections: ConnectionItem[] = [];
  // TODO: сохранять их по connection id
  //private lastProps?: WebSocketClientProps;

  /**
   * Make new connection to server.
   * It returns a connection id to use with other methods
   */
  newConnection(props: WebSocketClientProps): number {
    const client = this.connectToServer();
    const events = new IndexedEventEmitter();

    this.connections.push([
      client,
      events,
      props,
    ]);

    client.on(eventNames.open, () => events.emit(eventNames.open));
    client.on(eventNames.close, () => events.emit(eventNames.close));
    client.on(eventNames.message, (data: string | Uint8Array) => {
      events.emit(eventNames.message, data);
    });
    client.on(eventNames.error, (err: Error) => {
      events.emit(eventNames.error, err);
    });
    client.on('unexpected-response', (request: ClientRequest, responce: IncomingMessage) => {
      events.emit(`Unexpected response has been received: ${responce.statusCode}: ${responce.statusMessage}`);
    });

    return this.connections.length - 1;
  }

  onOpen(connectionId: number, cb: () => void): number {
    return this.connections[connectionId][CONNECTION_POSITIONS.events].addListener(eventNames.open, cb);
  }

  onClose(connectionId: number, cb: () => void): number {
    return this.connections[connectionId][CONNECTION_POSITIONS.events].addListener(eventNames.close, cb);
  }

  onMessage(connectionId: number, cb: (data: string | Uint8Array) => void): number {
    return this.connections[connectionId][CONNECTION_POSITIONS.events].addListener(eventNames.message, cb);
  }

  onError(connectionId: number, cb: (err: string) => void): number {
    return this.connections[connectionId][CONNECTION_POSITIONS.events].addListener(eventNames.error, cb);
  }

  removeEventListener(connectionId: number, eventName: WsClientEvents, handlerIndex: number) {
    return this.connections[connectionId][CONNECTION_POSITIONS.events].removeListener(eventName, handlerIndex);
  }


  send(connectionId: number, data: string | Uint8Array) {

    // TODO: support of null or undefined, number, boolean ???

    if (typeof data !== 'string' && !isUint8Array(data)) {
      throw new Error(`Unsupported type of data: "${JSON.stringify(data)}"`);
    }

    this.connections[connectionId].send(data);
  }

  close(connectionId: number, code: number, reason?: string) {
    if (!this.connections[connectionId]) return;

    this.connections[connectionId].close(code, reason);
    delete this.connections[connectionId];

    // TODO: проверить не будет ли ошибки если соединение уже закрыто
    // TODO: нужно ли отписываться от навешанных колбэков ???
    // TODO: remove all the listeners
  }

  /**
   * It uses to reconnect
   */
  reConnect(connectionId: number) {
    if (this.connections[connectionId]) {
      this.close(connectionId, 0);
      // TODO: remove all the listeners

    }

    this.connections[connectionId] = this.connectToServer();
  }

  destroy() {
    // TODO: удалить все события и вызвать close на всех клиентах
  }


  private connectToServer(): WebSocket {
    if (!this.lastProps) {
      throw new Error(`WebSocketClient: There isn't props`);
    }

    const client = new WebSocket(this.lastProps.url, {
    });


    return client;
  }

}
