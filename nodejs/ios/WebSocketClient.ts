import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';

import WebSocketClientIo, {WebSocketClientProps, WsClientEvent} from 'system/interfaces/io/WebSocketClientIo';
import IndexedEventEmitter from 'system/helpers/IndexedEventEmitter';
import {callPromised} from 'system/helpers/helpers';
import {omit} from 'system/helpers/lodashLike';
import {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';
import {makeConnectionParams} from './WebSocketServer';


/**
 * The same for lowjs and nodejs
 */
export default class WebSocketClient implements WebSocketClientIo {
  private readonly events = new IndexedEventEmitter();
  private readonly connections: WebSocket[] = [];


  async destroy() {
    for (let connectionId in this.connections) {
      await this.close(connectionId, 0, 'destroy');
    }
  }


  /**
   * Make new connection to server.
   * It returns a connection id to use with other methods
   */
  async newConnection(props: WebSocketClientProps): Promise<string> {
    const connectionId = String(this.connections.length);

    this.connections.push( this.connectToServer(connectionId, props) );

    return connectionId;
  }

  /**
   * It is used to reconnect on connections lost.
   * It closes previous connection and makes new one with the same id.
   */
  async reConnect(connectionId: string, props: WebSocketClientProps) {
    await this.close(connectionId, 0);

    this.connections[Number(connectionId)] = this.connectToServer(connectionId, props);
  }

  async onOpen(cb: (connectionId: string) => void): Promise<number> {
    return this.events.addListener(WsClientEvent.open, cb);
  }

  async onClose(cb: (connectionId: string) => void): Promise<number> {
    return this.events.addListener(WsClientEvent.close, cb);
  }

  async onMessage(cb: (connectionId: string, data: string | Uint8Array) => void): Promise<number> {
    return this.events.addListener(WsClientEvent.message, cb);
  }

  async onError(cb: (connectionId: string, err: Error) => void): Promise<number> {
    return this.events.addListener(WsClientEvent.error, cb);
  }

  async onUnexpectedResponse(cb: (connectionId: string, response: ConnectionParams) => void): Promise<number> {
    return this.events.addListener(WsClientEvent.unexpectedResponse, cb);
  }

  async removeEventListener(connectionId: string, eventName: WsClientEvent, handlerIndex: number) {
    const connectionItem = this.connections[Number(connectionId)];

    if (!connectionItem) return;

    this.events.removeListener(eventName, handlerIndex);
  }

  async send(connectionId: string, data: string | Uint8Array) {

    // TODO: is it need support of null or undefined, number, boolean ???

    if (typeof data !== 'string' && !(data instanceof Uint8Array)) {
      throw new Error(`Unsupported type of data: "${JSON.stringify(data)}"`);
    }

    const connectionItem = this.getConnectionItem(connectionId);

    await callPromised(connectionItem[CONNECTION_POSITIONS.webSocket].send, data);
  }

  async close(connectionId: string, code: number, reason?: string) {
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
    const client = new WebSocket(props.url, omit(props, 'url'));

    client.on(wsEventNames.open, () => events.emit(wsEventNames.open));
    client.on(wsEventNames.close, () => events.emit(wsEventNames.close));
    client.on(wsEventNames.message, (data: string | Uint8Array) => {
      events.emit(wsEventNames.message, data);
    });
    client.on(wsEventNames.error, (err: Error) => {
      events.emit(wsEventNames.error, err);
    });
    client.on('unexpected-response', (request: ClientRequest, response: IncomingMessage) => {
      events.emit(wsEventNames.unexpectedResponse, makeConnectionParams(response));
    });

    return [
      client,
      events,
    ];
  }

  private getWebSocketItem(connectionId: string): WebSocket {
    if (!this.connections[Number(connectionId)]) {
      throw new Error(`WebSocketClient: Connection "${connectionId}" hasn't been found`);
    }

    return this.connections[Number(connectionId)];
  }

}
