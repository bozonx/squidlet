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


/**
 * The same for lowjs and nodejs
 */
export default class WebSocketClient implements WebSocketClientIo {
  private readonly connections: ConnectionItem[] = [];

  /**
   * Make new connection to server.
   * It returns a connection id to use with other methods
   */
  newConnection(props: WebSocketClientProps): string {
    const connectionId = String(this.connections.length);

    this.connections.push( this.connectToServer(connectionId, props) );

    return connectionId;
  }

  /**
   * It is used to reconnect on connections lost.
   * It closes previous connection and makes new one with the same id.
   */
  reConnect(connectionId: string, props: WebSocketClientProps) {
    this.close(connectionId, 0);

    this.connections[Number(connectionId)] = this.connectToServer(connectionId, props);
  }

  /////// Connection's methods

  onOpen(connectionId: string, cb: () => void): number {
    const connectionItem = this.getConnectionItem(connectionId);

    return connectionItem[CONNECTION_POSITIONS.events].addListener(wsEventNames.open, cb);
  }

  onClose(connectionId: string, cb: () => void): number {
    const connectionItem = this.getConnectionItem(connectionId);

    return connectionItem[CONNECTION_POSITIONS.events].addListener(wsEventNames.close, cb);
  }

  onMessage(connectionId: string, cb: (data: string | Uint8Array) => void): number {
    const connectionItem = this.getConnectionItem(connectionId);

    return connectionItem[CONNECTION_POSITIONS.events].addListener(wsEventNames.message, cb);
  }

  onError(connectionId: string, cb: (err: Error) => void): number {
    const connectionItem = this.getConnectionItem(connectionId);

    return connectionItem[CONNECTION_POSITIONS.events].addListener(wsEventNames.error, cb);
  }

  removeEventListener(connectionId: string, eventName: WsEvents, handlerIndex: number) {
    const connectionItem = this.connections[Number(connectionId)];

    if (!connectionItem) return;

    return connectionItem[CONNECTION_POSITIONS.events].removeListener(eventName, handlerIndex);
  }

  send(connectionId: string, data: string | Uint8Array): Promise<void> {

    // TODO: is it need support of null or undefined, number, boolean ???

    if (typeof data !== 'string' && !isUint8Array(data)) {
      throw new Error(`Unsupported type of data: "${JSON.stringify(data)}"`);
    }

    const connectionItem = this.getConnectionItem(connectionId);

    return callPromised(connectionItem[CONNECTION_POSITIONS.webSocket].send, data);
  }

  close(connectionId: string, code: number, reason?: string) {
    const connectionItem = this.connections[Number(connectionId)];

    if (!connectionItem) return;

    connectionItem[CONNECTION_POSITIONS.webSocket].close(code, reason);
    connectionItem[CONNECTION_POSITIONS.events].destroy();

    delete this.connections[Number(connectionId)];

    // TODO: проверить не будет ли ошибки если соединение уже закрыто
    // TODO: нужно ли отписываться от навешанных колбэков - open, close etc ???
  }


  private connectToServer(connectionId: string, props: WebSocketClientProps): ConnectionItem {
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
    // TODO: не делать абстракцию
    client.on('unexpected-response', (request: ClientRequest, response: IncomingMessage) => {
      events.emit(
        wsEventNames.error,
        `Unexpected response has been received on connection "${connectionId}": ` +
        `${response.statusCode}: ${response.statusMessage}`
      );
    });

    return [
      client,
      events,
    ];
  }

  private getConnectionItem(connectionId: string): ConnectionItem {
    if (!this.connections[Number(connectionId)]) {
      throw new Error(`WebSocketClient: Connection "${connectionId}" hasn't been found`);
    }

    return this.connections[Number(connectionId)];
  }

}
