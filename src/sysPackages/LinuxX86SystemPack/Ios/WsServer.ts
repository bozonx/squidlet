import WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';
import {callPromised, IndexedEventEmitter} from 'squidlet-lib'
import {IoBase} from '../../../system/Io/IoBase.js'
import {WsServerConnectionParams, WsServerEvent, WsServerIo, WsServerProps} from '../../../types/io/WsServerIo.js'
import IndexedEvents from '../../../../../../../../../mnt/disk2/workspace/squidlet-lib/lib/IndexedEvents.js'
import {WsCloseStatus} from '../../../types/io/WsClientIoType.js'
import {ErrorEvent} from 'ws'


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

export function splitConnectionId(
  connectionId: string
): { serverId: string, socketId: number } {
  const splat = connectionId.split(CONNECTION_ID_DELIMITER)

  return { serverId: splat[0], socketId: parseInt(splat[1]) }
}


export class WsServer extends IoBase implements WsServerIo {
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
    // destroy events of server
    this.servers[Number(serverId)][ITEM_POSITION.events].destroy();

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

    // if (
    //   !socket.onerror || !socket.onopen || !socket.onclose || !socket.onmessage
    // ) throw new Error(`Connection ${connectionId} of server ${serverId} doesn't have some event methods`)

    socket.addEventListener('error', (event: WebSocket.ErrorEvent) => {
      this.events.emit(WsServerEvent.clientError, connectionId, event.message);
    })

    // TODO: что если соединение само закроется???
    socket.on('close', (code: number, reason: string) => {
      serverItem[ITEM_POSITION.events].emit(WsServerEvent.clientClose, connectionId, code, reason);
    });

    socket.on('message', (data: string | Buffer) => {
      let resolvedData: string | Uint8Array;

      if (Buffer.isBuffer(data)) {
        resolvedData = convertBufferToUint8Array(data);
      }
      else {
        resolvedData = data;
      }

      serverItem[ITEM_POSITION.events].emit(WsServerEvent.clientMessage, connectionId, resolvedData);
    });

    socket.on('unexpected-response', (request: ClientRequest, response: IncomingMessage) => {
      serverItem[ITEM_POSITION.events].emit(
        WsServerEvent.clientUnexpectedResponse,
        connectionId,
        makeConnectionParams(response)
      );
    });

    // emit new connection
    serverItem[ITEM_POSITION.events].emit(WsServerEvent.newConnection, connectionId, requestParams);
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
