import * as WebSocket from 'ws';

import WebSocketServerIo, {WebSocketServerProps, WSSeverDev} from 'system/interfaces/io/WebSocketServerIo';


export class WSServer implements WSSeverDev {
  private readonly server: WebSocket.Server;

  constructor(props: WebSocketServerProps) {

    // TODO: инстанс выдается на connection

    this.server = new WebSocket.Server(props);
  }


  // onClose(cb: () => void) {
  //   this.server.on('close', cb);
  // }
  //
  // onConnection(cb: () => void) {
  //   this.server.on('connection', cb);
  // }
  //
  // onListening(cb: () => void) {
  //   this.server.on('listening', cb);
  // }

  onMessage(cb: (data: any) => void) {
    // TODO: может навешивать только после on connection ????
    this.server.on('message', cb);
  }

  // onError(cb: (err: Error) => void) {
  //   this.server.on('error', cb);
  // }

  send(data: any) {
    //this.server.send(data);
  }

}


export default class WebSocketServer implements WebSocketServerIo {

  // TODO: сохранять инстансы серверов чтобы не создавать дважды на один host и port

  newServer(props: WebSocketServerProps): WSServer {
    return new WSServer(props);
  }

}
