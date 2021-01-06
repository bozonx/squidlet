import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';
import IndexedEventEmitter from 'squidlet-lib/src/IndexedEventEmitter'
import {convertBufferToUint8Array} from 'squidlet-lib/src/buffer'
import {callPromised} from 'squidlet-lib/src/common';

import WsServerIo, {
  CONNECTION_ID_DELIMITER,
  WsCloseStatus,
  WsServerConnectionParams, WsServerEvent, WsServerProps
} from '../../interfaces/io/WsServerIo';


// TODO: почему бы и не сделать объектом ??
type ServerItem = [
  // server instance
  WebSocket.Server,
  // connection instances
  (WebSocket | undefined)[],
  // is server listening.
  boolean
];

enum ITEM_POSITION {
  wsServer,
  // saved Socket instances
  connections,
  listeningState,
}


export function makeConnectionParams(request: IncomingMessage): WsServerConnectionParams {
  return {
    url: request.url as string,
    method: request.method as string,
    statusCode: request.statusCode as number,
    statusMessage: request.statusMessage as string,
    headers: {
      authorization: request.headers.authorization,
      cookie: request.headers.cookie,
      'user-agent': request.headers['user-agent'],
    },
  };
}

export function makeServerId(props: WsServerProps): string {
  return `${props.host}:${props.port}`
}
export function makeConnectionId(serverId: string, socketId: number): string {
  return `${serverId}${CONNECTION_ID_DELIMITER}${socketId}`
}

export function splitConnectionId(
  connectionId: string
): { serverId: string, socketId: number } {
  const splat = connectionId.split(CONNECTION_ID_DELIMITER)

  return { serverId: splat[0], socketId: parseInt(splat[1]) }
}


export default class WsServer implements WsServerIo {
  private readonly events = new IndexedEventEmitter()
  private readonly servers: Record<string, ServerItem> = {}


  async destroy() {
    this.events.destroy()

    for (const serverId of Object.keys(this.servers)) {
      await this.destroyServer(serverId);

      delete this.servers[serverId]
    }
  }

  async on(eventName: WsServerEvent, cb: (...params: any[]) => void): Promise<number> {
    return this.events.addListener(eventName, cb);
  }

  async off(handlerIndex: number): Promise<void> {
    this.events.removeListener(handlerIndex)
  }


  async newServer(props: WsServerProps): Promise<string> {
    const serverId: string = makeServerId(props)

    if (!this.servers[serverId]) {
      this.servers[serverId] = this.makeServer(serverId, props)
    }

    return serverId;
  }

  async sendMessage(connectionId: string, data: string | Uint8Array): Promise<void> {
    if (typeof data !== 'string' && !(data instanceof Uint8Array)) {
      throw new Error(`Unsupported type of data: "${JSON.stringify(data)}"`)
    }

    const {serverId, socketId} = splitConnectionId(connectionId)
    const serverItem = this.getServerItem(serverId)
    const socket = serverItem[ITEM_POSITION.connections][socketId]

    if (!socket) throw new Error(`Can't find socket "${socketId}`)

    await callPromised(socket.send.bind(socket), data)
  }

  async closeConnection(
    connectionId: string,
    code: WsCloseStatus,
    reason: string
  ): Promise<void> {
    const {serverId, socketId} = splitConnectionId(connectionId)
    const socket = this.servers[serverId]?.[ITEM_POSITION.connections][socketId]

    if (!socket) return

    socket.close(code, reason)

    this.servers[serverId][ITEM_POSITION.connections][socketId] = undefined
  }

  async destroyServer(serverId: string): Promise<void> {
    if (!this.servers[serverId]) return;

    const server = this.servers[serverId][ITEM_POSITION.wsServer];

    // call server close
    // TODO: может быть ошибка при дестрое
    await callPromised(server.close.bind(server));

    delete this.servers[serverId];
  }


  private makeServer(serverId: string, props: WsServerProps): ServerItem {
    // TODO: использовать http сервер так чтобы там можно было ещё и поднимать
    //       обычные http роуты
    const server = new WebSocket.Server(props);

    server.on('close', () => {
      this.events.emit(WsServerEvent.serverClosed, serverId)
    });
    server.on('listening', () => this.handleServerStarted(serverId));
    server.on('error', (err) => {
      this.events.emit(
        WsServerEvent.error,
        `Server ${serverId} error: ${err}`,
        serverId
      )
    });
    server.on('connection', (socket: WebSocket, request: IncomingMessage) => {
      this.handleIncomeConnection(serverId, socket, request);
    });

    return [
      server,
      // an empty connections
      [],
      // not listening at the moment
      false
    ];
  }

  private handleServerStarted = (serverId: string) => {
    const serverItem = this.getServerItem(serverId);

    serverItem[ITEM_POSITION.listeningState] = true;

    this.events.emit(WsServerEvent.serverStarted, serverId);
  }

  private handleIncomeConnection(
    serverId: string,
    socket: WebSocket,
    request: IncomingMessage
  ) {
    const serverItem = this.getServerItem(serverId)
    const connections = serverItem[ITEM_POSITION.connections]
    const socketId = connections.length
    const connectionId: string = makeConnectionId(serverId, socketId)
    const requestParams: WsServerConnectionParams = makeConnectionParams(request)

    connections.push(socket)

    socket.on('error', (err: Error) => {
      this.events.emit(
        WsServerEvent.error,
        `Server ${serverId} connection ${connectionId} error: ${err}`,
        serverId,
        connectionId
      )
    })

    socket.on('unexpected-response', (request: ClientRequest, response: IncomingMessage) => {
      this.events.emit(
        WsServerEvent.error,
        `Server ${serverId} connection ${connectionId} unexpected response: ` +
          `${JSON.stringify(makeConnectionParams(response))}`,
        serverId,
        connectionId,
      )
    })

    socket.on('close', (code: number, reason: string) => {
      if (this.servers[serverId]?.[ITEM_POSITION.connections][socketId]) {
        this.servers[serverId][ITEM_POSITION.connections][socketId] = undefined
      }

      this.events.emit(
        WsServerEvent.connectionClosed,
        connectionId,
        code,
        reason,
        serverId
      )
    })

    socket.on('message', (data: string | Buffer) => {
      const resolvedData: string | Uint8Array = (Buffer.isBuffer(data))
        ? convertBufferToUint8Array(data)
        : data

      this.events.emit(WsServerEvent.incomeMessage, connectionId, resolvedData, serverId)
    });

    // emit new connection
    this.events.emit(WsServerEvent.newConnection, connectionId, requestParams, serverId)
  }

  private getServerItem(serverId: string): ServerItem {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`WsServer IO: Server "${serverId}" hasn't been found`);
    }

    return this.servers[Number(serverId)];
  }

}
