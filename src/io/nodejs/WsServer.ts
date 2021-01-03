import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';
import IndexedEventEmitter from 'squidlet-lib/src/IndexedEventEmitter'

import WsServerIo, {
  CONNECTION_ID_DELIMITER,
  WsCloseStatus,
  WsServerConnectionParams, WsServerEvent, WsServerProps
} from '../../interfaces/io/WsServerIo';


type ServerItem = [
  // server instance
  WebSocket.Server,
  // connection instances
  WebSocket[],
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


export default class WsServer implements WsServerIo {
  private readonly events = new IndexedEventEmitter()
  private readonly servers: Record<string, ServerItem> = {}


  async destroy() {
    for (const serverId of Object.keys(this.servers)) {
      await this.destroyServer(serverId);
    }
  }

  async on(eventName: WsServerEvent, cb: (...params: any[]) => void): Promise<number> {
    return this.events.addListener(WsServerEvent.serverClosed, cb);
  }

  async off(handlerIndex: number): Promise<void> {
    this.events.removeListener(handlerIndex)
  }


  async newServer(props: WsServerProps): Promise<string> {
    const serverId: string = this.makeServerId(props)

    if (!this.servers[serverId]) {
      this.servers[serverId] = this.makeServer(serverId, props)
    }

    return serverId;
  }

  async sendMessage(connectionId: string, data: string | Uint8Array): Promise<void> {
    // TODO: что если connection уже закрылся?? - нужно дать определенно понять это
    //       драйверу чтобы тот ожидал нового подключения с того же клиента

    // TODO: is it need support of null or undefined, number, boolean ???

    if (typeof data !== 'string' && !(data instanceof Uint8Array)) {
      throw new Error(`Unsupported type of data: "${JSON.stringify(data)}"`);
    }

    const serverItem = this.getServerItem(serverId);
    const socket = serverItem[ITEM_POSITION.connections][Number(connectionId)];

    await callPromised(socket.send.bind(socket), data);
  }

  async closeConnection(
    connectionId: string,
    code: WsCloseStatus,
    reason: string
  ): Promise<void> {
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

  async destroyServer(serverId: string): Promise<void> {
    // TODO: remove all the server's events

    if (!this.servers[Number(serverId)]) return;
    // destroy events of server
    this.servers[Number(serverId)][ITEM_POSITION.events].destroy();

    const server = this.servers[Number(serverId)][ITEM_POSITION.wsServer];

    // call server close
    // TODO: если раскоментировать то будет ошибка при дестрое
    //await callPromised(server.close.bind(server));

    delete this.servers[Number(serverId)];
  }

  // async destroyConnection(serverId: string, connectionId: string): Promise<void> {
  //   // TODO: удалить обработчики событий close на это connection
  //   // TODO: закрыть
  //   // TODO: зачем принимать serverId ???
  // }


  private makeServer(serverId: string, props: WsServerProps): ServerItem {
    // TODO: использовать http сервер так чтобы там можно было ещё и поднимать
    //       обычные http роуты
    const server = new WebSocket.Server(props);

    server.on('close', () => {
      this.events.emit(WsServerEvent.serverClosed, serverId)
    });
    server.on('listening', () => this.handleServerStarted(serverId));
    server.on('error', (err) => {
      this.events.emit(WsServerEvent.error, `Server ${serverId} error: ${err}`)
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
    const serverItem = this.getServerItem(serverId);
    const connections = serverItem[ITEM_POSITION.connections];
    const connectionId: string = this.makeConnectionId(serverId, connections.length);
    const requestParams: WsServerConnectionParams = makeConnectionParams(request);

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

  private makeConnectionId(serverId: string, connectionsLength: number) {
    return `${serverId}${CONNECTION_ID_DELIMITER}${connectionsLength}`
  }

}
