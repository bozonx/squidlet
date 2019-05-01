import * as WebSocket from 'ws';

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


type ServerItem = [ WebSocket.Server, IndexedEventEmitter<AnyHandler> ];

enum SERVER_POSITIONS {
  wsServer,
  events
}


export default class WebSocketServer implements WebSocketServerIo {
  private readonly servers: ServerItem[] = [];

  // make new server and return serverId
  newServer(props: WebSocketServerProps): string {
    this.servers.push( this.makeServer(props) );

    return String(this.servers.length - 1);
  }

  closeServer(serverId: string): Promise<void> {
    return callPromised(this.servers[Number(serverId)][SERVER_POSITIONS.wsServer].close);
  }

  // when new client is connected
  onConnection(serverId: string, cb: (connectionId: string, connectionParams: ConnectionParams) => void): number {
    return this.servers[Number(serverId)][SERVER_POSITIONS.events]
      .addListener(wsServerEventNames.connection, cb);
  }

  // when server starts listening
  onServerListening(serverId: string, cb: () => void): number {

  }

  // on server close. Depend on http server close
  onServerClose(serverId: string, cb: () => void): number {

  }

  onServerError(serverId: string, cb: (err: Error) => void): number {

  }

  // connection's methods like in client
  //onOpen              (serverId: string, connectionId: string, cb: () => void): number;
  onClose(serverId: string, connectionId: string, cb: () => void): number {

  }

  onMessage(serverId: string, connectionId: string, cb: (data: string | Uint8Array) => void): number {

  }

  onError(serverId: string, connectionId: string, cb: (err: Error) => void): number {

  }
  // TODO: remove server listener
  // TODO: какие события ???
  removeEventListener(serverId: string, connectionId: string, eventName: WsEvents, handlerIndex: number): void {

  }

  removeServerEventListener(serverId: string, eventName: WsServerEvents, handlerIndex: number): void {

  }

  send(serverId: string, connectionId: string, data: string | Uint8Array): Promise<void> {


  }

  close(serverId: string, connectionId: string, code: number, reason: string): void {

  }


  private makeServer(props: WebSocketServerProps): ServerItem {
    const events = new IndexedEventEmitter();
    const server = new WebSocket.Server(props);

    server.on('close', (code: number, reason: string) => {
      console.info(`Websocket server closed: ${code}: ${reason}`);
    });

    server.on('error', (err: Error) => {
      this.errorEvents.emit(`Websocket io set has received an error: ${err}`);
    });

    server.on('listening', () => {
      console.info(`Http server started listening`);
    });

    server.on('connection', this.handleIncomeConnection);

    return [
      server,
      events,
    ];
  }

}
