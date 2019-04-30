import * as WebSocket from 'ws';

import WebSocketServerIo, {ConnectionParams, WebSocketServerProps} from 'system/interfaces/io/WebSocketServerIo';
import {WsClientEvents} from '../../system/interfaces/io/WebSocketClientIo';


// export class WSServer implements WSSeverIo {
//   private readonly server: WebSocket.Server;
//
//   constructor(props: WebSocketServerProps) {
//
//     // TODO: инстанс выдается на connection
//
//     this.server = new WebSocket.Server(props);
//   }
//
//
//   // onClose(cb: () => void) {
//   //   this.server.on('close', cb);
//   // }
//   //
//   // onConnection(cb: () => void) {
//   //   this.server.on('connection', cb);
//   // }
//   //
//   // onListening(cb: () => void) {
//   //   this.server.on('listening', cb);
//   // }
//
//   onMessage(cb: (data: any) => void) {
//     // TODO: может навешивать только после on connection ????
//     this.server.on('message', cb);
//   }
//
//   // onError(cb: (err: Error) => void) {
//   //   this.server.on('error', cb);
//   // }
//
//   send(data: any) {
//     //this.server.send(data);
//   }
//
// }


export default class WebSocketServer implements WebSocketServerIo {

  // TODO: сохранять инстансы серверов чтобы не создавать дважды на один host и port

  // newServer(props: WebSocketServerProps): WSServer {
  //   return new WSServer(props);
  // }

  // make new server and return serverId
  newServer(props: WebSocketServerProps): string {

  }

  // when new client is connected
  onConnection(serverId: string, cb: (connectionId: string, connectionParams: ConnectionParams) => void): number {

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
  removeEventListener(serverId: string, connectionId: string, eventName: WsClientEvents, handlerIndex: number): void {

  }

  send(serverId: string, connectionId: string, data: string | Uint8Array): void {


  }

  close(serverId: string, connectionId: string, code: number, reason: string): void {

  }
}
