import * as WebSocket from 'ws';
import {IncomingMessage} from 'http';


import WebSocketServerIo, {
  ConnectionParams,
  WebSocketServerProps,
  wsServerEventNames,
  WsServerEvents
} from 'system/interfaces/io/WebSocketServerIo';
import {WsEvents} from 'system/interfaces/io/WebSocketClientIo';
import IndexedEventEmitter from 'system/helpers/IndexedEventEmitter';
import {AnyHandler} from 'system/helpers/IndexedEvents';
import {callPromised} from 'system/helpers/helpers';


// Server instance, server's events, connections
type ServerItem = [ WebSocket.Server, IndexedEventEmitter<AnyHandler>, WebSocket[] ];

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

  // connection's methods like in client
  //onOpen              (serverId: string, connectionId: string, cb: () => void): number;
  onClose(serverId: string, connectionId: string, cb: () => void): number {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`WebSocketServer: Server "${serverId}" hasn't been found`);
    }

    // TODO: add
  }

  onMessage(serverId: string, connectionId: string, cb: (data: string | Uint8Array) => void): number {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`WebSocketServer: Server "${serverId}" hasn't been found`);
    }

    // TODO: add
  }

  onError(serverId: string, connectionId: string, cb: (err: Error) => void): number {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`WebSocketServer: Server "${serverId}" hasn't been found`);
    }

    // TODO: add
  }

  send(serverId: string, connectionId: string, data: string | Uint8Array): Promise<void> {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`WebSocketServer: Server "${serverId}" hasn't been found`);
    }

    // TODO: add
    //return callPromised(this.servers[Number(serverId)][SERVER_POSITIONS.wsServer].send)
  }

  close(serverId: string, connectionId: string, code: number, reason: string): void {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`WebSocketServer: Server "${serverId}" hasn't been found`);
    }

    // TODO: add
  }

  // TODO: remove server listener
  // TODO: какие события ???
  removeEventListener(serverId: string, connectionId: string, eventName: WsEvents, handlerIndex: number): void {
    if (!this.servers[Number(serverId)]) {
      throw new Error(`WebSocketServer: Server "${serverId}" hasn't been found`);
    }

    // TODO: add
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
    const connections: WebSocket[] = this.servers[Number(serverId)][SERVER_POSITIONS.connections];
    const connectionId: string = String(connections.length);
    const connectionParams: ConnectionParams = {
      url: request.url as string,
    };

    connections.push(socket);

    this.servers[Number(serverId)][SERVER_POSITIONS.events]
      .emit(wsServerEventNames.connection, connectionId, connectionParams);
  }

}
