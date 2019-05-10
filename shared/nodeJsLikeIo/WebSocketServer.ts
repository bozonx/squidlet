import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';


import WebSocketServerIo, {
  ConnectionParams,
  WebSocketServerProps,
  wsServerEventNames,
  WsServerEvents
} from 'system/interfaces/io/WebSocketServerIo';
import {wsEventNames, WsEvents} from 'system/interfaces/io/WebSocketClientIo';
import IndexedEventEmitter from 'system/helpers/IndexedEventEmitter';
import {AnyHandler} from 'system/helpers/IndexedEvents';
import {callPromised} from 'system/helpers/helpers';
import {CONNECTION_POSITIONS, ConnectionItem} from './WebSocketClient';


// Server instance, server's events, [connection, connection's events]
type ServerItem = [ WebSocket.Server, IndexedEventEmitter<AnyHandler>, ConnectionItem[] ];

enum SERVER_POSITIONS {
  wsServer,
  events,
  connections
}


/**
 * The same for lowjs and nodejs
 */
export default class WebSocketServer implements WebSocketServerIo {
  private readonly servers: ServerItem[] = [];

  /////// Server's methods

  newServer(props: WebSocketServerProps): string {
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

  onConnection(serverId: string, cb: (connectionId: string, connectionParams: ConnectionParams) => void): number {
    const serverItem = this.getServerItem(serverId);

    return serverItem[SERVER_POSITIONS.events].addListener(wsServerEventNames.connection, cb);
  }

  onServerListening(serverId: string, cb: () => void): number {
    const serverItem = this.getServerItem(serverId);

    return serverItem[SERVER_POSITIONS.events].addListener(wsServerEventNames.listening, cb);
  }

  onServerClose(serverId: string, cb: () => void): number {
    const serverItem = this.getServerItem(serverId);

    return serverItem[SERVER_POSITIONS.events].addListener(wsServerEventNames.close, cb);
  }

  onServerError(serverId: string, cb: (err: Error) => void): number {
    const serverItem = this.getServerItem(serverId);

    return serverItem[SERVER_POSITIONS.events].addListener(wsServerEventNames.error, cb);
  }

  removeServerEventListener(serverId: string, eventName: WsServerEvents, handlerIndex: number): void {
    if (!this.servers[Number(serverId)]) return;

    return this.servers[Number(serverId)][SERVER_POSITIONS.events].removeListener(eventName, handlerIndex);
  }


  ////////// Connection's methods like in client, but without onOpen

  onClose(serverId: string, connectionId: string, cb: () => void): number {
    const connectionItem = this.getConnectionItem(serverId, connectionId);

    return connectionItem[CONNECTION_POSITIONS.events].addListener(wsEventNames.close, cb);
  }

  onMessage(serverId: string, connectionId: string, cb: (data: string | Uint8Array) => void): number {
    const connectionItem = this.getConnectionItem(serverId, connectionId);

    return connectionItem[CONNECTION_POSITIONS.events].addListener(wsEventNames.message, cb);
  }

  onError(serverId: string, connectionId: string, cb: (err: Error) => void): number {
    const connectionItem = this.getConnectionItem(serverId, connectionId);

    return connectionItem[CONNECTION_POSITIONS.events].addListener(wsEventNames.error, cb);
  }

  onUnexpectedResponce(serverId: string, connectionId: string, cb: (err: Error) => void): number {
    const connectionItem = this.getConnectionItem(serverId, connectionId);

    return connectionItem[CONNECTION_POSITIONS.events].addListener(wsEventNames.error, cb);
  }

  removeEventListener(serverId: string, connectionId: string, eventName: WsEvents, handlerIndex: number): void {
    if (
      !this.servers[Number(serverId)]
      || !this.servers[Number(serverId)][SERVER_POSITIONS.connections][Number(connectionId)]
    ) {
      return;
    }

    const connectionItem = this.servers[Number(serverId)][SERVER_POSITIONS.connections][Number(connectionId)];

    return connectionItem[CONNECTION_POSITIONS.events].removeListener(eventName, handlerIndex);
  }

  send(serverId: string, connectionId: string, data: string | Uint8Array): Promise<void> {

    // TODO: is it need support of null or undefined, number, boolean ???

    if (typeof data !== 'string' && !(data instanceof Uint8Array)) {
      throw new Error(`Unsupported type of data: "${JSON.stringify(data)}"`);
    }

    const connectionItem = this.getConnectionItem(serverId, connectionId);

    return callPromised(connectionItem[CONNECTION_POSITIONS.webSocket].send, data);
  }

  close(serverId: string, connectionId: string, code: number, reason: string): void {
    if (
      !this.servers[Number(serverId)]
      || !this.servers[Number(serverId)][SERVER_POSITIONS.connections][Number(connectionId)]
    ) {
      return;
    }

    const connectionItem = this.servers[Number(serverId)][SERVER_POSITIONS.connections][Number(connectionId)];

    connectionItem[CONNECTION_POSITIONS.webSocket].close(code, reason);
    connectionItem[CONNECTION_POSITIONS.events].destroy();

    delete this.servers[Number(serverId)][SERVER_POSITIONS.connections][Number(connectionId)];

    // TODO: проверить не будет ли ошибки если соединение уже закрыто
    // TODO: нужно ли отписываться от навешанных колбэков - open, close etc ???
  }


  private makeServer(serverId: string, props: WebSocketServerProps): ServerItem {
    const events = new IndexedEventEmitter();
    const server = new WebSocket.Server(props);

    server.on('close', () => events.emit(wsServerEventNames.close));
    server.on('listening', () => events.emit(wsServerEventNames.listening));
    server.on('error', () => events.emit(wsServerEventNames.error));
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
    const connections = this.servers[Number(serverId)][SERVER_POSITIONS.connections];
    const events = new IndexedEventEmitter();
    const connectionId: string = String(connections.length);
    const connectionParams: ConnectionParams = this.makeConnectionParams(request);

    connections.push([
      socket,
      events
    ]);

    socket.on('error', (err: Error) => events.emit(wsEventNames.error, err));
    socket.on('open', () => events.emit(wsEventNames.open));
    socket.on('close', (code: number, reason: string) => {
      events.emit(wsEventNames.close, code, reason);
    });
    socket.on('message', (data: string | Uint8Array) => {
      events.emit(wsEventNames.message, data);
    });
    // TODO: не делать абстракцию
    socket.on('unexpected-response', (request: ClientRequest, response: IncomingMessage) => {
      events.emit(
        wsEventNames.error,
        `Unexpected response has been received on server "${serverId}", ` +
        `connection "${connectionId}": ${response.statusCode}: ${response.statusMessage}`
      );
    });

    // emit new connection
    this.servers[Number(serverId)][SERVER_POSITIONS.events]
      .emit(wsServerEventNames.connection, connectionId, connectionParams);
  }

  private makeConnectionParams(request: IncomingMessage): ConnectionParams {
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

  private getServerItem(serverId: string): ServerItem {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`WebSocketServer: Server "${serverId}" hasn't been found`);
    }

    return this.servers[Number(serverId)];
  }

  private getConnectionItem(serverId: string, connectionId: string): ConnectionItem {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`WebSocketServer: Server "${serverId}" hasn't been found`);
    }
    else if (!this.servers[Number(serverId)][SERVER_POSITIONS.connections][Number(connectionId)]) {
      throw new Error(`WebSocketServer: Connection "${connectionId}" hasn't been found on server "${serverId}"`);
    }

    return this.servers[Number(serverId)][SERVER_POSITIONS.connections][Number(connectionId)];
  }

}
