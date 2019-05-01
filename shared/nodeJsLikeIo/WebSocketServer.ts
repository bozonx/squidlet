import * as WebSocket from 'ws';
import {IncomingMessage} from 'http';


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


export default class WebSocketServer implements WebSocketServerIo {
  private readonly servers: ServerItem[] = [];

  /////// Server's methods

  // make new server and return serverId
  newServer(props: WebSocketServerProps): string {
    const serverId: string = String(this.servers.length);

    this.servers.push( this.makeServer(serverId, props) );

    return serverId;
  }

  async closeServer(serverId: string): Promise<void> {
    if (!this.servers[Number(serverId)]) return;

    this.servers[Number(serverId)][SERVER_POSITIONS.events].destroy();

    // TODO: does it need to close connections ???

    await callPromised(this.servers[Number(serverId)][SERVER_POSITIONS.wsServer].close);

    delete this.servers[Number(serverId)];
  }

  // when new client is connected
  onConnection(serverId: string, cb: (connectionId: string, connectionParams: ConnectionParams) => void): number {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`WebSocketServer: Server "${serverId}" hasn't been found`);
    }

    return this.servers[Number(serverId)][SERVER_POSITIONS.events]
      .addListener(wsServerEventNames.connection, cb);
  }

  // when server starts listening
  onServerListening(serverId: string, cb: () => void): number {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`WebSocketServer: Server "${serverId}" hasn't been found`);
    }

    return this.servers[Number(serverId)][SERVER_POSITIONS.events]
      .addListener(wsServerEventNames.listening, cb);
  }

  // on server close. Depend on http server close
  onServerClose(serverId: string, cb: () => void): number {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`WebSocketServer: Server "${serverId}" hasn't been found`);
    }

    return this.servers[Number(serverId)][SERVER_POSITIONS.events]
      .addListener(wsServerEventNames.close, cb);
  }

  onServerError(serverId: string, cb: (err: Error) => void): number {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`WebSocketServer: Server "${serverId}" hasn't been found`);
    }

    return this.servers[Number(serverId)][SERVER_POSITIONS.events]
      .addListener(wsServerEventNames.error, cb);
  }

  removeServerEventListener(serverId: string, eventName: WsServerEvents, handlerIndex: number): void {
    if (!this.servers[Number(serverId)]) return;

    return this.servers[Number(serverId)][SERVER_POSITIONS.events]
      .removeListener(eventName, handlerIndex);
  }

  /////// Connection's methods

  onClose(serverId: string, connectionId: string, cb: () => void): number {
    const connection = this.getConnectionItem(serverId, connectionId);

    return connection[CONNECTION_POSITIONS.events].addListener(wsEventNames.close, cb);
  }

  onMessage(serverId: string, connectionId: string, cb: (data: string | Uint8Array) => void): number {
    const connection = this.getConnectionItem(serverId, connectionId);

    return connection[CONNECTION_POSITIONS.events].addListener(wsEventNames.message, cb);
  }

  onError(serverId: string, connectionId: string, cb: (err: Error) => void): number {
    const connection = this.getConnectionItem(serverId, connectionId);

    return connection[CONNECTION_POSITIONS.events].addListener(wsEventNames.error, cb);
  }

  send(serverId: string, connectionId: string, data: string | Uint8Array): Promise<void> {
    const connection = this.getConnectionItem(serverId, connectionId);

    return callPromised(connection[CONNECTION_POSITIONS.webSocket].send, data);
  }

  close(serverId: string, connectionId: string, code: number, reason: string): void {
    const connection = this.getConnectionItem(serverId, connectionId);

    return connection[CONNECTION_POSITIONS.webSocket].close(code, reason);
  }

  removeEventListener(serverId: string, connectionId: string, eventName: WsEvents, handlerIndex: number): void {
    if (
      !this.servers[Number(serverId)]
      || !this.servers[Number(serverId)][SERVER_POSITIONS.connections][Number(connectionId)]
    ) {
      return;
    }

    const connection = this.servers[Number(serverId)][SERVER_POSITIONS.connections][Number(connectionId)];

    return connection[CONNECTION_POSITIONS.events].removeListener(eventName, handlerIndex);
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
    const connectionParams: ConnectionParams = {
      url: request.url as string,
    };

    connections.push([
      socket,
      events
    ]);

    // TODO: listen connection events

    this.servers[Number(serverId)][SERVER_POSITIONS.events]
      .emit(wsServerEventNames.connection, connectionId, connectionParams);
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
