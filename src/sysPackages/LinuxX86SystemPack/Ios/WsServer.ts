import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';
import {IndexedEventEmitter} from 'squidlet-lib'
import {IoBase} from '../../../system/Io/IoBase.js'
import {WsServerConnectionParams, WsServerEvent, WsServerIo, WsServerProps} from '../../../types/io/WsServerIo.js'


type ServerItem = [
  // server instance
  WebSocket.WebSocketServer,
  // server's events
  //IndexedEventEmitter,
  // connection instances
  WebSocket[],
  // is server listening.
  boolean
]

enum ITEM_POSITION {
  wsServer,
  //events,
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


export class WsServer extends IoBase implements WsServerIo {
  private readonly events = new IndexedEventEmitter()
  // like {'host:port': [server, events, connections[], isListening]}
  private readonly servers: Record<string, ServerItem> = {}


  destroy = async () => {
    for (const serverId of Object.keys(this.servers)) {
      await this.destroyServer(serverId)
    }
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

  async onConnection(
    cb: (serverId: string, connectionId: string, params: ConnectionParams) => void
  ): Promise<number> {
    return this.events.addListener(WsServerEvent.newConnection, cb)
  }

  async onServerListening(serverId: string, cb: () => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    if (serverItem[ITEM_POSITION.listeningState]) {
      cb();

      return -1;
    }

    return serverItem[ITEM_POSITION.events].once(WsServerEvent.listening, cb);
  }

  async onServerClose(serverId: string, cb: () => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[ITEM_POSITION.events].addListener(WsServerEvent.serverClose, cb);
  }

  async onServerError(serverId: string, cb: (err: Error) => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[ITEM_POSITION.events].addListener(WsServerEvent.serverError, cb);
  }

  async removeListener(serverId: string, handlerIndex: number): Promise<void> {
    if (!this.servers[Number(serverId)]) return;

    return this.servers[Number(serverId)][ITEM_POSITION.events].removeListener(handlerIndex);
  }


  ////////// Connection's methods like client's, but without onOpen

  async onClose(serverId: string, cb: (connectionId: string) => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[ITEM_POSITION.events].addListener(WsServerEvent.clientClose, cb);
  }

  async onMessage(serverId: string, cb: (connectionId: string, data: string | Uint8Array) => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[ITEM_POSITION.events].addListener(WsServerEvent.clientMessage, cb);
  }

  async onError(serverId: string, cb: (connectionId: string, err: Error) => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[ITEM_POSITION.events].addListener(WsServerEvent.clientError, cb);
  }

  async onUnexpectedResponse(serverId: string, cb: (connectionId: string, response: ConnectionParams) => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[ITEM_POSITION.events].addListener(WsServerEvent.clientUnexpectedResponse, cb);
  }

  async send(serverId: string, connectionId: string, data: string | Uint8Array): Promise<void> {

    // TODO: is it need support of null or undefined, number, boolean ???

    if (typeof data !== 'string' && !(data instanceof Uint8Array)) {
      throw new Error(`Unsupported type of data: "${JSON.stringify(data)}"`);
    }

    const serverItem = this.getServerItem(serverId);
    const socket = serverItem[ITEM_POSITION.connections][Number(connectionId)];

    await callPromised(socket.send.bind(socket), data);
  }

  async close(serverId: string, connectionId: string, code: WsCloseStatus, reason: string): Promise<void> {
    if (
      !this.servers[Number(serverId)]
      || !this.servers[Number(serverId)][ITEM_POSITION.connections][Number(connectionId)]
    ) {
      return;
    }

    const connectionItem = this.servers[Number(serverId)][ITEM_POSITION.connections][Number(connectionId)];

    connectionItem.close(code, reason);

    delete this.servers[Number(serverId)][ITEM_POSITION.connections][Number(connectionId)];

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

    server.on('close', () => events.emit(WsServerEvent.serverClose));
    server.on('listening', () => this.handleServerStartListening(serverId));
    server.on('error', (err) => events.emit(WsServerEvent.serverError, err));
    server.on('connection', (socket: WebSocket, request: IncomingMessage) => {
      this.handleIncomeConnection(serverId, socket, request);
    });

    return [
      server,
      events,
      // an empty connections
      [],
      // not listening at the moment
      false
    ];
  }

  private handleServerStartListening = (serverId: string) => {
    const serverItem = this.getServerItem(serverId);

    serverItem[ITEM_POSITION.listeningState] = true;

    serverItem[ITEM_POSITION.events].emit(WsServerEvent.listening);
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
    const serverItem = this.getServerItem(serverId);
    const connections = serverItem[ITEM_POSITION.connections];
    const connectionId: string = String(connections.length);
    const requestParams: ConnectionParams = makeConnectionParams(request);

    connections.push(socket);

    socket.on('error', (err: Error) => {
      serverItem[ITEM_POSITION.events].emit(WsServerEvent.clientError, connectionId, err);
    });

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
