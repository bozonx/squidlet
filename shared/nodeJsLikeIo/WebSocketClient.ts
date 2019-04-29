import * as WebSocket from 'ws';

import WebSocketClientIo, {WebSocketClientProps} from 'system/interfaces/io/WebSocketClientIo';
import {ClientRequest, IncomingMessage} from 'http';
import IndexedEvents from '../../system/helpers/IndexedEvents';
import {isUint8Array} from '../../system/helpers/collections';


type WsClientEvents = 'open' | 'close' | 'message' | 'error';


export default class WebSocketClient implements WebSocketClientIo {
  private readonly errorEvents = new IndexedEvents<(err: string) => void>();
  private readonly connections: WebSocket[] = [];
  // TODO: сохранять их по connection id
  private lastProps?: WebSocketClientProps;

  /**
   * Make new connection to server.
   * It returns a connection id to use with other methods
   */
  newConnection(props: WebSocketClientProps): number {
    this.lastProps = props;

    const client = this.connectToServer();

    this.connections.push(client);

    return this.connections.length - 1;
  }

  onOpen(connectionId: number, cb: () => void) {
    this.connections[connectionId].on('open', cb);
  }

  onClose(connectionId: number, cb: () => void) {
    this.connections[connectionId].on('close', cb);
  }

  onMessage(connectionId: number, cb: (data: string | Uint8Array) => void) {
    // TODO: check data

    this.connections[connectionId].on('message', cb);
  }

  onError(connectionId: number, cb: (err: string) => void) {
    this.errorEvents.addListener(cb);
  }

  // on(event: WsClientEvents, cb: Function) {
  //
  // }

  removeEventListener(connectionId: number, event: WsClientEvents, listener: (...args: any[]) => void) {
    if (event === 'error') {
      this.errorEvents.removeListener(listener);
    }
    else {
      this.connections[connectionId].removeEventListener(event, listener);
    }
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
  }

  /**
   * It uses to reconnect
   */
  reConnect(connectionId: number) {
    if (this.connections[connectionId]) {
      this.close(connectionId, 0);
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

    client.on('error', (err: Error) => {
      this.errorEvents.emit(`ERROR: ${err}`);
    });

    client.on('unexpected-response', (request: ClientRequest, responce: IncomingMessage) => {
      this.errorEvents.emit(`Unexpected response has been received: ${responce.statusCode}: ${responce.statusMessage}`);
    });

    return client;
  }

}
