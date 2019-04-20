import * as WebSocket from 'ws';

import WebSocketClientDev, {WebSocketClientProps, WSClientDev} from 'system/interfaces/dev/WebSocketClientDev';


export class WSClient implements WSClientDev {
  private readonly client: WebSocket;

  constructor(props: WebSocketClientProps) {
    this.client = new WebSocket('ws://www.host.com/path', {
    });
  }

  // onOpen(cb: () => void) {
  //   this.client.on('open', cb);
  // }

  onClose(cb: () => void) {
    //this.client.on('open', cb);
  }

  onMessage(cb: (data: any) => void) {
    this.client.on('message', cb);
  }

  onError(cb: (err: Error) => void) {
    this.client.on('error', cb);
  }

  send(data: any) {
    this.client.send(data);
  }

}

export default class WebSocketClient implements WebSocketClientDev {
  newClient(props: WebSocketClientProps): WSClient {
    return new WSClient(props);
  }
}
