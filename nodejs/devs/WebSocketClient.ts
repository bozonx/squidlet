import * as WebSocket from 'ws';

import WebSocketClientDev, {WSClientDev} from '../../system/interfaces/dev/WebSocketClientDev';


export class WSClient implements WSClientDev {
  private readonly client: WebSocket;

  constructor() {
    this.client = new WebSocket('ws://www.host.com/path', {
    });
  }

  onOpen(cb: () => void) {
    this.client.on('open', cb);
  }

  onMessage(cb: (data: any) => void) {
    this.client.on('message', cb);
  }

  send(data: any) {
    this.client.send(data);
  }

}

export default class WebSocketClient implements WebSocketClientDev {
  // TODO: !!!!
}
