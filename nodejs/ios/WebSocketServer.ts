import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';

import WebSocketServerIo, {
  ConnectionParams,
  WebSocketServerProps,
  WsServerEvent,
} from 'system/interfaces/io/WebSocketServerIo';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {AnyHandler} from 'system/lib/IndexedEvents';
import {callPromised} from 'system/lib/helpers';


type ServerItem = [ WebSocket.Server, IndexedEventEmitter<AnyHandler>, WebSocket[] ];

enum SERVER_POSITIONS {
  wsServer,
  events,
  connections
}


export function makeConnectionParams(request: IncomingMessage): ConnectionParams {
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


/**
 * The same for lowjs and nodejs
 */
export default class WebSocketServer implements WebSocketServerIo {
  private readonly servers: ServerItem[] = [];


  async destroy() {
    for (let serverId in this.servers) {
      await this.closeServer(serverId);
    }
  }


  /////// Server's methods

  async newServer(props: WebSocketServerProps): Promise<string> {
    const serverId: string = String(this.servers.length);

    this.servers.push( this.makeServer(serverId, props) );

    return serverId;
  }

  async closeServer(serverId: string): Promise<void> {
    if (!this.servers[Number(serverId)]) return;

    this.servers[Number(serverId)][SERVER_POSITIONS.events].destroy();

    // TODO: does it need closing connections ???

    await callPromised(this.servers[Number(serverId)][SERVER_POSITIONS.wsServer].close);

    delete this.servers[Number(serverId)];
  }

  async onConnection(
    serverId: string,
    cb: (connectionId: string, request: ConnectionParams) => void
  ): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[SERVER_POSITIONS.events].addListener(WsServerEvent.newConnection, cb);
  }

  async onServerListening(serverId: string, cb: () => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[SERVER_POSITIONS.events].addListener(WsServerEvent.listening, cb);
  }

  async onServerClose(serverId: string, cb: () => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[SERVER_POSITIONS.events].addListener(WsServerEvent.serverClose, cb);
  }

  async onServerError(serverId: string, cb: (err: Error) => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[SERVER_POSITIONS.events].addListener(WsServerEvent.serverError, cb);
  }

  async removeEventListener(serverId: string, eventName: WsServerEvent, handlerIndex: number): Promise<void> {
    if (!this.servers[Number(serverId)]) return;

    return this.servers[Number(serverId)][SERVER_POSITIONS.events].removeListener(eventName, handlerIndex);
  }


  ////////// Connection's methods like client's, but without onOpen

  async onClose(serverId: string, cb: (connectionId: string) => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[SERVER_POSITIONS.events].addListener(WsServerEvent.clientClose, cb);
  }

  async onMessage(serverId: string, cb: (connectionId: string, data: string | Uint8Array) => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[SERVER_POSITIONS.events].addListener(WsServerEvent.clientMessage, cb);
  }

  async onError(serverId: string, cb: (connectionId: string, err: Error) => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[SERVER_POSITIONS.events].addListener(WsServerEvent.clientError, cb);
  }

  async onUnexpectedResponse(serverId: string, cb: (connectionId: string, response: ConnectionParams) => void): Promise<number> {
    const serverItem = this.getServerItem(serverId);

    return serverItem[SERVER_POSITIONS.events].addListener(WsServerEvent.clientUnexpectedResponse, cb);
  }

  async send(serverId: string, connectionId: string, data: string | Uint8Array): Promise<void> {

    // TODO: is it need support of null or undefined, number, boolean ???

    if (typeof data !== 'string' && !(data instanceof Uint8Array)) {
      throw new Error(`Unsupported type of data: "${JSON.stringify(data)}"`);
    }

    const serverItem = this.getServerItem(serverId);
    const socket = serverItem[SERVER_POSITIONS.connections][Number(connectionId)];

    await callPromised(socket.send, data);
  }

  async close(serverId: string, connectionId: string, code: number, reason: string): Promise<void> {
    if (
      !this.servers[Number(serverId)]
      || !this.servers[Number(serverId)][SERVER_POSITIONS.connections][Number(connectionId)]
    ) {
      return;
    }

    const connectionItem = this.servers[Number(serverId)][SERVER_POSITIONS.connections][Number(connectionId)];

    connectionItem.close(code, reason);

    delete this.servers[Number(serverId)][SERVER_POSITIONS.connections][Number(connectionId)];

    // TODO: проверить не будет ли ошибки если соединение уже закрыто
    // TODO: нужно ли отписываться от навешанных колбэков - open, close etc ???
  }


  private makeServer(serverId: string, props: WebSocketServerProps): ServerItem {
    const events = new IndexedEventEmitter();
    const server = new WebSocket.Server(props);

    server.on('close', () => events.emit(WsServerEvent.serverClose));
    server.on('listening', () => events.emit(WsServerEvent.listening));
    server.on('error', (err) => events.emit(WsServerEvent.serverError, err));
    server.on('connection', (socket: WebSocket, request: IncomingMessage) => {
      this.handleIncomeConnection(serverId, socket, request);
    });

    return [
      server,
      events,
      // an empty connections
      [],
    ];
  }

  private handleIncomeConnection(serverId: string, socket: WebSocket, request: IncomingMessage) {
    const serverItem = this.getServerItem(serverId);
    const connections = serverItem[SERVER_POSITIONS.connections];
    const connectionId: string = String(connections.length);
    const requestParams: ConnectionParams = makeConnectionParams(request);

    connections.push(socket);

    socket.on('error', (err: Error) => {
      serverItem[SERVER_POSITIONS.events].emit(WsServerEvent.clientError, connectionId, err);
    });

    socket.on('close', (code: number, reason: string) => {
      serverItem[SERVER_POSITIONS.events].emit(WsServerEvent.clientClose, connectionId, code, reason);
    });

    socket.on('message', (data: string | Uint8Array) => {
      serverItem[SERVER_POSITIONS.events].emit(WsServerEvent.clientMessage, connectionId, data);
    });

    socket.on('unexpected-response', (request: ClientRequest, response: IncomingMessage) => {
      serverItem[SERVER_POSITIONS.events].emit(
        WsServerEvent.clientUnexpectedResponse,
        connectionId,
        makeConnectionParams(response)
      );
    });

    // emit new connection
    serverItem[SERVER_POSITIONS.events].emit(WsServerEvent.newConnection, connectionId, requestParams);
  }

  private getServerItem(serverId: string): ServerItem {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`WebSocketServer: Server "${serverId}" hasn't been found`);
    }

    return this.servers[Number(serverId)];
  }

}
