import WebSocket from 'ws'
import {ClientRequest, IncomingMessage} from 'http'
import IndexedEventEmitter from 'squidlet-lib/src/IndexedEventEmitter'

import WsClientIo, {WsClientEvent, WsClientProps} from '../../interfaces/io/WsClientIo'
import {WsCloseStatus} from '../../interfaces/io/WsServerIo'


export default class WsClient implements WsClientIo {
  private readonly events = new IndexedEventEmitter()
  private readonly connections: (WebSocket | undefined)[] = []


  async destroy() {
    this.events.destroy()

    for (let connectionId in this.connections) {
      await this.close(connectionId, WsCloseStatus.closeGoingAway, 'destroy')

      this.connections[connectionId] = undefined
    }
  }

  async on(eventName: WsClientEvent, cb: (...params: any[]) => void): Promise<number> {
    return this.events.addListener(eventName, cb);
  }

  async off(handlerIndex: number): Promise<void> {
    this.events.removeListener(handlerIndex)
  }


  /**
   * Make new connection to server.
   * It returns a connection id to use with other methods
   */
  async newConnection(props: WsClientProps): Promise<string> {
    const connectionId = String(this.connections.length);

    this.connections.push( this.connectToServer(connectionId, props) );

    return connectionId;
  }

  async send(connectionId: string, data: string | Uint8Array) {

    // TODO: is it need support of null or undefined, number, boolean ???

    if (typeof data !== 'string' && !(data instanceof Uint8Array)) {
      throw new Error(`Unsupported type of data: "${JSON.stringify(data)}"`);
    }

    const client = this.connections[Number(connectionId)];

    await callPromised(client.send.bind(client), data);
  }

  async close(connectionId: string, code: number, reason?: string) {
    const connection = this.connections[Number(connectionId)];

    if (!connection) return;

    connection.close(code, reason);

    delete this.connections[Number(connectionId)];

    // TODO: проверить не будет ли ошибки если соединение уже закрыто
    // TODO: нужно ли отписываться от навешанных колбэков - open, close etc ???
  }

  /**
   * destroy all the events of connection and close it
   */
  async destroyConnection(connectionId: string): Promise<void> {
    // TODO: destroy all the events of connection
  }


  private connectToServer(connectionId: string, props: WebSocketClientProps): WebSocket {
    const client = new WebSocket(props.url, omitObj(props, 'url'));

    client.on('open', () => this.events.emit(WsClientEvent.open, connectionId));
    client.on('close', () => this.events.emit(WsClientEvent.close, connectionId));
    client.on('message', (data: string | Uint8Array) => {
      let resolvedData: string | Uint8Array;

      if (Buffer.isBuffer(data)) {
        resolvedData = convertBufferToUint8Array(data);
      }
      else {
        resolvedData = data;
      }

      this.events.emit(WsClientEvent.message, connectionId, resolvedData);
    });
    client.on('error', (err: Error) => {
      this.events.emit(WsClientEvent.error, connectionId, err);
    });
    client.on('unexpected-response', (request: ClientRequest, response: IncomingMessage) => {
      this.events.emit(WsClientEvent.unexpectedResponse, connectionId, makeConnectionParams(response));
    });

    return client;
  }

}

// /**
//  * It is used to reconnect on connections lost.
//  * It closes previous connection and makes new one with the same id.
//  */
// async reConnect(connectionId: string, props: WebSocketClientProps) {
//   await this.close(connectionId, WsCloseStatus.closeNormal);
//
//   this.connections[Number(connectionId)] = this.connectToServer(connectionId, props);
// }
