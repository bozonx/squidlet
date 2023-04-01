import WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http'
import {callPromised, convertBufferToUint8Array, IndexedEventEmitter, omitObj} from 'squidlet-lib'
import {WsClientIoType, WebSocketClientProps, WsCloseStatus, WsClientEvent} from '../../../types/io/WsClientIoType.js'
import {IoBase} from '../../../system/Io/IoBase.js'
import {makeConnectionParams} from './WsServer.js'


export class WsClient extends IoBase implements WsClientIoType {
  private readonly events = new IndexedEventEmitter()
  private readonly connections: (WebSocket | undefined)[] = []


  destroy = async () => {
    this.events.destroy()

    for (let connectionId in this.connections) {
      await this.close(connectionId, WsCloseStatus.closeGoingAway, 'destroy');
    }
  }


  /**
   * Make new connection to server.
   * It returns a connection id to use with other methods
   */
  async newConnection(props: WebSocketClientProps): Promise<string> {
    const connectionId = String(this.connections.length)

    this.connections.push( this.connectToServer(connectionId, props) )

    return connectionId
  }

  /**
   * It is used to reconnect on connections lost.
   * It closes previous connection and makes new one with the same id.
   */
  async reConnect(connectionId: string, props: WebSocketClientProps) {

    // TODO: зачем передавать props - они же должны быть те же

    await this.close(connectionId, WsCloseStatus.closeNormal)

    this.connections[Number(connectionId)] = this.connectToServer(connectionId, props)
  }

  async onOpen(cb: (connectionId: string) => void): Promise<number> {
    return this.events.addListener(WsClientEvent.open, cb)
  }

  async onClose(cb: (connectionId: string) => void): Promise<number> {
    return this.events.addListener(WsClientEvent.close, cb)
  }

  async onMessage(cb: (connectionId: string, data: string | Uint8Array) => void): Promise<number> {
    return this.events.addListener(WsClientEvent.message, cb)
  }

  async onError(cb: (connectionId: string, err: Error) => void): Promise<number> {
    return this.events.addListener(WsClientEvent.error, cb)
  }

  async onUnexpectedResponse(cb: (connectionId: string, response: ConnectionParams) => void): Promise<number> {
    return this.events.addListener(WsClientEvent.unexpectedResponse, cb)
  }

  async removeListener(connectionId: string, handlerIndex: number) {

    // TODO: зачем тут connectionId ???

    const connectionItem = this.connections[Number(connectionId)]

    if (!connectionItem) return

    this.events.removeListener(handlerIndex)
  }

  async send(connectionId: string, data: string | Uint8Array) {
    // TODO: is it need support of null or undefined, number, boolean ???

    if (typeof data !== 'string' && !(data instanceof Uint8Array)) {
      throw new Error(`Unsupported type of data: "${JSON.stringify(data)}"`)
    }

    const client = this.connections[Number(connectionId)]

    if (!client) throw new Error(`Connection ${connectionId} isn't registered`)

    await callPromised(client.send.bind(client), data)
  }

  async close(connectionId: string, code?: number, reason?: string) {
    const connection = this.connections[Number(connectionId)]

    if (!connection) return

    connection.close(code, reason)

    delete this.connections[Number(connectionId)]

    // TODO: проверить не будет ли ошибки если соединение уже закрыто
    // TODO: нужно ли отписываться от навешанных колбэков - open, close etc ???
  }

  /**
   * destroy all the events of connection and close it
   */
  async destroyConnection(connectionId: string): Promise<void> {
    // TODO: а это зачем???
    // TODO: destroy all the events of connection
  }


  private connectToServer(connectionId: string, props: WebSocketClientProps): WebSocket {
    const client = new WebSocket(props.url, omitObj(props, 'url'))

    client.on('open', () => this.events.emit(WsClientEvent.open, connectionId))
    // TODO: если соединение само закрылось не по желанию пользователя - то удалить его
    client.on('close', () => this.events.emit(WsClientEvent.close, connectionId))
    client.on('message', (data: string | Uint8Array) => {
      let resolvedData: string | Uint8Array

      if (Buffer.isBuffer(data)) {
        resolvedData = convertBufferToUint8Array(data)
      }
      else {
        resolvedData = data
      }

      this.events.emit(WsClientEvent.message, connectionId, resolvedData)
    });
    client.on('error', (err: Error) => {
      this.events.emit(WsClientEvent.error, connectionId, err)
    });
    client.on('unexpected-response', (request: ClientRequest, response: IncomingMessage) => {
      this.events.emit(WsClientEvent.unexpectedResponse, connectionId, makeConnectionParams(response));
    });

    return client
  }

}
