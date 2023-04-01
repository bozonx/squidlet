import WebSocket from 'ws'
import {ClientRequest, IncomingMessage} from 'http'
import {callPromised, convertBufferToUint8Array, IndexedEvents} from 'squidlet-lib'
import {IoBase} from '../../../system/Io/IoBase.js'
import {WsServerConnectionParams, WsServerEvent, WsServerIoType, WsServerProps} from '../../../types/io/WsServerIoType.js'
import {WsCloseStatus} from '../../../types/io/WsClientIoType.js'


type ServerItem = [
  // server instance
  WebSocket.WebSocketServer,
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
      'User-Agent': request.headers['User-Agent'],
    },
  };
}


export class WsServer extends IoBase implements WsServerIoType {
  private readonly events = new IndexedEvents()
  // like {'host:port': [server, events, connections[], isListening]}
  private readonly servers: Record<string, ServerItem> = {}


  destroy = async () => {
    for (const serverId of Object.keys(this.servers)) {
      await this.destroyServer(serverId)
    }
  }


  /**
   * Listen all the events of all the servers and connections
   */
  async on(cb: (...p: any[]) => void): Promise<number> {
    return this.events.addListener(cb)
  }

  async off(handlerIndex: number) {
    this.events.removeListener(handlerIndex)
  }

  async newServer(props: WsServerProps): Promise<string> {
    const serverId: string = this.makeServerId(props)

    if (this.servers[serverId]) {
      throw new Error(`Server ${serverId} already exists`)
    }

    this.servers[serverId] = this.makeServer(serverId, props)

    return serverId
  }

  async closeServer(serverId: string): Promise<void> {
    await this.destroyServer(serverId)

    // TODO: надо наверное удалить сервер из this.servers
  }

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


  private makeServer(serverId: string, props: WsServerProps): ServerItem {
    // TODO: использовать http сервер так чтобы там можно было ещё и поднимать
    //       обычные http роуты
    const server = new WebSocket.WebSocketServer(props);

    server.on('close', () =>
      // TODO: а разве код и reason не должны прийти???
      this.events.emit(WsServerEvent.serverClosed, serverId))
    server.on('error', (err) =>
      this.events.emit(WsServerEvent.serverError, serverId, err))
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

  private handleServerStartListening = (serverId: string) => {
    const serverItem = this.getServerItem(serverId)

    serverItem[ITEM_POSITION.listeningState] = true

    this.events.emit(WsServerEvent.serverStarted, serverId)
  }

  private async destroyServer(serverId: string) {
    // TODO: он не закрывает соединения

    if (!this.servers[Number(serverId)]) return;

    const server = this.servers[Number(serverId)][ITEM_POSITION.wsServer];

    // call server close
    // TODO: если раскоментировать то будет ошибка при дестрое
    //await callPromised(server.close.bind(server));

    delete this.servers[Number(serverId)];
  }

  private handleIncomeConnection(serverId: string, socket: WebSocket, request: IncomingMessage) {
    const serverItem = this.getServerItem(serverId)
    const connections = serverItem[ITEM_POSITION.connections]
    const connectionId: string = String(connections.length)
    const requestParams: WsServerConnectionParams = makeConnectionParams(request)

    connections.push(socket)

    socket.on('error', (err: Error) => {
      this.events.emit(WsServerEvent.clientError, serverId, connectionId, err)
    })

    // TODO: что если соединение само закроется???
    socket.on('close', (code: number, reason: string) => {
      this.events.emit(WsServerEvent.clientClose, serverId, connectionId, code, reason)
    });

    socket.on('message', (data: string | Buffer) => {
      let resolvedData: string | Uint8Array = data

      if (Buffer.isBuffer(data)) {
        resolvedData = convertBufferToUint8Array(data)
      }

      this.events.emit(WsServerEvent.clientMessage, serverId, connectionId, resolvedData)
    })

    socket.on('unexpected-response', (request: ClientRequest, response: IncomingMessage) => {
      this.events.emit(
        WsServerEvent.clientUnexpectedResponse,
        serverId,
        connectionId,
        makeConnectionParams(response)
      );
    });

    // emit new connection
    this.events.emit(WsServerEvent.newConnection, connectionId, requestParams)
  }

  private getServerItem(serverId: string): ServerItem {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`WebSocketServer: Server "${serverId}" hasn't been found`);
    }

    return this.servers[Number(serverId)];
  }

  private makeServerId(props: WsServerProps): string {
    return `${props.host}:${props.port}`
  }

}
