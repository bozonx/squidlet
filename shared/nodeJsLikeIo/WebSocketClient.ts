import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';

import WebSocketClientIo, {WebSocketClientProps, WsClientEvents} from 'system/interfaces/io/WebSocketClientIo';
import {isUint8Array} from 'system/helpers/collections';
import IndexedEventEmitter from 'system/helpers/IndexedEventEmitter';
import {AnyHandler} from 'system/helpers/IndexedEvents';


type ConnectionItem = [ WebSocket, IndexedEventEmitter<AnyHandler> ];

enum CONNECTION_POSITIONS {
  webSocket,
  events
}

const eventNames = {
  open: 'open',
  close: 'close',
  message: 'message',
  error: 'error',
};


export default class WebSocketClient implements WebSocketClientIo {
  private readonly connections: ConnectionItem[] = [];

  /**
   * Make new connection to server.
   * It returns a connection id to use with other methods
   */
  newConnection(props: WebSocketClientProps): number {
    this.connections.push( this.connectToServer(props) );

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

    // TODO: is it need support of null or undefined, number, boolean ???

    if (typeof data !== 'string' && !isUint8Array(data)) {
      throw new Error(`Unsupported type of data: "${JSON.stringify(data)}"`);
    }

    this.connections[connectionId][CONNECTION_POSITIONS.webSocket].send(data);
  }

  close(connectionId: number, code: number, reason?: string) {
    if (!this.connections[connectionId]) return;

    this.connections[connectionId][CONNECTION_POSITIONS.webSocket].close(code, reason);
    this.connections[connectionId][CONNECTION_POSITIONS.events].destroy();

    delete this.connections[connectionId];

    // TODO: проверить не будет ли ошибки если соединение уже закрыто
    // TODO: нужно ли отписываться от навешанных колбэков - open, close etc ???
  }

  /**
   * It is used to reconnect on connections lost.
   * It closes previous connection and makes new one with the same id.
   */
  reConnect(connectionId: number, props: WebSocketClientProps) {
    this.close(connectionId, 0);

    this.connections[connectionId] = this.connectToServer(props);
  }

  destroy() {
    // TODO: удалить все события и вызвать close на всех клиентах
    for (let connectionId in this.connections) {
      this.close(parseInt(connectionId), 0, 'Destroy');
    }
  }


  private connectToServer(props: WebSocketClientProps): ConnectionItem {
    const events = new IndexedEventEmitter();
    const client = new WebSocket(props.url, {
    });

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

    return [
      client,
      events,
    ];
  }

}
