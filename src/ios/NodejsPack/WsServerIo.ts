import WebSocket, { WebSocketServer } from 'ws'
import type {ClientRequest, IncomingMessage} from 'http'
import {callPromised, convertBufferToUint8Array} from 'squidlet-lib'
import {WsServerEvent} from '../../types/io/WsServerIoType.js'
import type {WsServerConnectionParams, WsServerIoType, WsServerProps} from '../../types/io/WsServerIoType.js'
import type {WsCloseStatus} from '../../types/io/WsClientIoType.js'
import {ServerIoBase} from '../../base/ServerIoBase.js'
import type {IoIndex} from '../../types/types.js'
import type {IoContext} from '../../system/context/IoContext.js'


type ServerItem = [
  // server instance
  WebSocketServer,
  // connection instances
  WebSocket[],
  // is server listening.
  boolean
]

enum ITEM_POSITION {
  wsServer,
  // saved Socket instances
  connections,
  listeningState,
}


export const WsServerIoIndex: IoIndex = (ctx: IoContext) => {
  return new WsServerIo(ctx)
}


// TODO: review
export function makeConnectionParams(request: IncomingMessage): WsServerConnectionParams {
  return {
    url: request.url as string,
    method: request.method as string,
    statusCode: request.statusCode as number,
    statusMessage: request.statusMessage as string,
    headers: {
      Authorization: request.headers.authorization,
      Cookie: request.headers.cookie,
      'User-Agent': request.headers['user-agent'],
    },
  };
}


export class WsServerIo extends ServerIoBase<ServerItem, WsServerProps> implements WsServerIoType {
  async send(serverId: string, connectionId: string, data: string | Uint8Array): Promise<void> {

    // TODO: is it need support of null or undefined, number, boolean ???

    if (typeof data !== 'string' && !(data instanceof Uint8Array)) {
      throw new Error(`Unsupported type of data: "${JSON.stringify(data)}"`)
    }

    const serverItem = this.getServerItem(serverId)
    const socket = serverItem[ITEM_POSITION.connections][Number(connectionId)]

    // TODO: а может ли быть socket закрытый??? и быть undefined???

    await callPromised(socket.send.bind(socket), data)
  }

  async closeConnection(serverId: string, connectionId: string, code?: WsCloseStatus, reason?: string): Promise<void> {
    const serverItem = this.getServerItem(serverId)
    const connectionItem = serverItem?.[ITEM_POSITION.connections]?.[Number(connectionId)]

    if (!connectionItem) return

    connectionItem.close(code, reason)

    delete serverItem[ITEM_POSITION.connections][Number(connectionId)]

    // TODO: проверить не будет ли ошибки если соединение уже закрыто
    // TODO: нужно ли отписываться от навешанных колбэков - open, close etc ???
  }

  async destroyConnection(serverId: string, connectionId: string): Promise<void> {
    // TODO: удалить обработчики событий close на это connection
    // TODO: закрыть
  }


  protected startServer(serverId: string, props: WsServerProps): ServerItem {
    const server = new WebSocketServer(props)

    server.on('close', () =>
      // TODO: а разве код и reason не должны прийти???
      this.events.emit(WsServerEvent.serverClosed, serverId))
    server.on('error', (err) =>
      this.events.emit(WsServerEvent.serverError, serverId, String(err)))
    server.on('listening', () =>
      this.handleServerStartListening(serverId))
    server.on('connection', (socket: WebSocket, request: IncomingMessage) =>
      this.handleIncomeConnection(serverId, socket, request))

    return [
      server,
      // an empty connections
      [],
      // not listening at the moment
      false
    ]
  }

  protected async destroyServer(serverId: string) {
    // TODO: он не закрывает соединения

    if (!this.servers[serverId]) return

    // call server close
    // TODO: если раскоментировать то будет ошибка при дестрое
    //await callPromised(server.close.bind(server));

    delete this.servers[serverId]
  }

  protected makeServerId(props: WsServerProps): string {
    return `${props.host}:${props.port}`
  }


  private handleServerStartListening = (serverId: string) => {
    const serverItem = this.getServerItem(serverId)

    serverItem[ITEM_POSITION.listeningState] = true

    this.events.emit(WsServerEvent.serverStarted, serverId)
  }

  private handleIncomeConnection(serverId: string, socket: WebSocket, request: IncomingMessage) {
    const serverItem = this.getServerItem(serverId)
    const connections = serverItem[ITEM_POSITION.connections]
    const connectionId: string = String(connections.length)
    const requestParams: WsServerConnectionParams = makeConnectionParams(request)

    connections.push(socket)

    socket.on('error', (err: Error) => {
      this.events.emit(WsServerEvent.connectionError, serverId, connectionId, err)
    })

    // TODO: что если соединение само закроется???
    socket.on('close', (code: number, reason: string) => {
      this.events.emit(WsServerEvent.connectionClose, serverId, connectionId, code, reason)
    });

    socket.on('message', (data: string | Buffer) => {
      if (!Buffer.isBuffer(data)) {
        this.events.emit(WsServerEvent.connectionError, serverId, connectionId, `Income data isn't a buffer`)

        return
      }

      let resolvedData: Uint8Array = convertBufferToUint8Array(data)

      this.events.emit(WsServerEvent.connectionMessage, serverId, connectionId, resolvedData)
    })

    socket.on('unexpected-response', (request: ClientRequest, response: IncomingMessage) => {
      this.events.emit(
        WsServerEvent.connectionUnexpectedResponse,
        serverId,
        connectionId,
        makeConnectionParams(response)
      );
    });

    // emit new connection
    this.events.emit(WsServerEvent.newConnection, serverId, connectionId, requestParams)
  }

}
