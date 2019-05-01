import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';

import WebSocketClientIo, {WebSocketClientProps, wsEventNames, WsEvents} from 'system/interfaces/io/WebSocketClientIo';
import {isUint8Array} from 'system/helpers/collections';
import IndexedEventEmitter from 'system/helpers/IndexedEventEmitter';
import {AnyHandler} from 'system/helpers/IndexedEvents';
import {callPromised} from 'system/helpers/helpers';


export type ConnectionItem = [ WebSocket, IndexedEventEmitter<AnyHandler> ];

export enum CONNECTION_POSITIONS {
  webSocket,
  events
}


export default class WebSocketClient implements WebSocketClientIo {
  private readonly connections: ConnectionItem[] = [];

  /**
   * Make new connection to server.
   * It returns a connection id to use with other methods
   */
  newConnection(props: WebSocketClientProps): string {
    this.connections.push( this.connectToServer(props) );

    return String(this.connections.length - 1);
  }

  onOpen(connectionId: string, cb: () => void): number {
    if (!this.connections[Number(connectionId)]) {
      throw new Error(`WebSocketClient: Connection "${connectionId}" hasn't been found`);
    }

    return this.connections[Number(connectionId)][CONNECTION_POSITIONS.events]
      .addListener(wsEventNames.open, cb);
  }

  onClose(connectionId: string, cb: () => void): number {
    if (!this.connections[Number(connectionId)]) {
      throw new Error(`WebSocketClient: Connection "${connectionId}" hasn't been found`);
    }

    return this.connections[Number(connectionId)][CONNECTION_POSITIONS.events]
      .addListener(wsEventNames.close, cb);
  }

  onMessage(connectionId: string, cb: (data: string | Uint8Array) => void): number {
    if (!this.connections[Number(connectionId)]) {
      throw new Error(`WebSocketClient: Connection "${connectionId}" hasn't been found`);
    }

    return this.connections[Number(connectionId)][CONNECTION_POSITIONS.events]
      .addListener(wsEventNames.message, cb);
  }

  onError(connectionId: string, cb: (err: Error) => void): number {
    if (!this.connections[Number(connectionId)]) {
      throw new Error(`WebSocketClient: Connection "${connectionId}" hasn't been found`);
    }

    return this.connections[Number(connectionId)][CONNECTION_POSITIONS.events]
      .addListener(wsEventNames.error, cb);
  }

  removeEventListener(connectionId: string, eventName: WsEvents, handlerIndex: number) {
    if (!this.connections[Number(connectionId)]) {
      throw new Error(`WebSocketClient: Connection "${connectionId}" hasn't been found`);
    }

    return this.connections[Number(connectionId)][CONNECTION_POSITIONS.events]
      .removeListener(eventName, handlerIndex);
  }

  send(connectionId: string, data: string | Uint8Array): Promise<void> {
    if (!this.connections[Number(connectionId)]) {
      throw new Error(`WebSocketClient: Connection "${connectionId}" hasn't been found`);
    }

    // TODO: is it need support of null or undefined, number, boolean ???

    if (typeof data !== 'string' && !isUint8Array(data)) {
      throw new Error(`Unsupported type of data: "${JSON.stringify(data)}"`);
    }

    return callPromised(this.connections[Number(connectionId)][CONNECTION_POSITIONS.webSocket].send, data);
  }

  close(connectionId: string, code: number, reason?: string) {
    if (!this.connections[Number(connectionId)]) return;

    this.connections[Number(connectionId)][CONNECTION_POSITIONS.webSocket].close(code, reason);
    this.connections[Number(connectionId)][CONNECTION_POSITIONS.events].destroy();

    delete this.connections[Number(connectionId)];

    // TODO: проверить не будет ли ошибки если соединение уже закрыто
    // TODO: нужно ли отписываться от навешанных колбэков - open, close etc ???
  }

  /**
   * It is used to reconnect on connections lost.
   * It closes previous connection and makes new one with the same id.
   */
  reConnect(connectionId: string, props: WebSocketClientProps) {
    this.close(connectionId, 0);

    this.connections[Number(connectionId)] = this.connectToServer(props);
  }

  destroyConnection(connectionId: string) {
    if (!this.connections[Number(connectionId)]) return;

    this.connections[Number(connectionId)][CONNECTION_POSITIONS.webSocket].close(0);
    this.connections[Number(connectionId)][CONNECTION_POSITIONS.events].destroy();

    delete this.connections[Number(connectionId)];
  }


  private connectToServer(props: WebSocketClientProps): ConnectionItem {
    const events = new IndexedEventEmitter();
    const client = new WebSocket(props.url, {
    });

    client.on(wsEventNames.open, () => events.emit(wsEventNames.open));
    client.on(wsEventNames.close, () => events.emit(wsEventNames.close));
    client.on(wsEventNames.message, (data: string | Uint8Array) => {
      events.emit(wsEventNames.message, data);
    });
    client.on(wsEventNames.error, (err: Error) => {
      events.emit(wsEventNames.error, err);
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
