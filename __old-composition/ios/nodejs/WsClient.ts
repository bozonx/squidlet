import WebSocket from 'ws'
import {ClientRequest, IncomingMessage} from 'http'
import IndexedEventEmitter from 'squidlet-lib/src/IndexedEventEmitter'
import {callPromised} from 'squidlet-lib/src/common'
import {omitObj} from 'squidlet-lib/src/objects'
import {convertBufferToUint8Array} from 'squidlet-lib/src/buffer'

import WsClientIo, {WsClientEvent, WsClientProps} from '../../interfaces/io/WsClientIo'
import {WsCloseStatus} from '../../interfaces/io/WsServerIo'
import {makeConnectionParams} from './WsServer'


export default class WsClient implements WsClientIo {
  private readonly events = new IndexedEventEmitter()
  private connections: (WebSocket | undefined)[] = []


  async destroy() {
    this.events.destroy()

    for (let connectionId in this.connections) {
      await this.closeConnection(
        connectionId,
        WsCloseStatus.closeGoingAway,
        'destroy'
      )
    }

    delete this.connections
  }

  async on(eventName: WsClientEvent, cb: (...params: any[]) => void): Promise<number> {
    return this.events.addListener(eventName, cb)
  }

  async off(handlerIndex: number): Promise<void> {
    this.events.removeListener(handlerIndex)
  }


  async newConnection(props: WsClientProps): Promise<string> {
    const connectionId = String(this.connections.length)

    this.connections.push(this.connectToServer(connectionId, props))

    return connectionId
  }

  async sendMessage(connectionId: string, data: string | Uint8Array) {
    if (typeof data !== 'string' && !(data instanceof Uint8Array)) {
      throw new Error(`Unsupported type of data: "${JSON.stringify(data)}"`)
    }

    const socket = this.connections[Number(connectionId)]

    if (!socket) throw new Error(`Can't find connection "${connectionId}`)

    await callPromised(socket.send.bind(socket), data);
  }

  async closeConnection(connectionId: string, code: number, reason?: string) {
    const socket = this.connections[Number(connectionId)]

    if (!socket) return

    socket.close(code, reason)

    delete this.connections[Number(connectionId)]
  }


  private connectToServer(connectionId: string, props: WsClientProps): WebSocket {
    const socket = new WebSocket(props.url, omitObj(props, 'url'));

    socket.on('open', () => {
      this.events.emit(WsClientEvent.opened, connectionId)
    });
    socket.on('close', () => {
      if (this.connections[Number(connectionId)]) {
        this.connections[Number(connectionId)] = undefined
      }

      this.events.emit(WsClientEvent.closed, connectionId)
    });
    socket.on('error', (err: Error) => {
      this.events.emit(
        WsClientEvent.error,
        connectionId,
        `Connection ${connectionId} error: ${err}`
      );
    });
    socket.on('unexpected-response', (request: ClientRequest, response: IncomingMessage) => {
      this.events.emit(
        WsClientEvent.error,
        connectionId,
        `Connection ${connectionId} unexpected response: ` +
        `${JSON.stringify(makeConnectionParams(response))}`,
      );
    });

    socket.on('message', (data: string | Buffer) => {
      const resolvedData: string | Uint8Array = (Buffer.isBuffer(data))
        ? convertBufferToUint8Array(data)
        : data

      this.events.emit(WsClientEvent.incomeMessage, connectionId, resolvedData);
    });

    return socket;
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

// /**
//  * destroy all the events of connection and close it
//  */
// async destroyConnection(connectionId: string): Promise<void> {
//   // TODO: destroy all the events of connection
// }
