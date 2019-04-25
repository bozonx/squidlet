import * as WebSocket from 'ws';

import WebSocketClientIo, {WebSocketClientProps, WSClientIo} from 'system/interfaces/io/WebSocketClientIo';


export class WSClient implements WSClientIo {
  private _client?: WebSocket;
  private get client(): WebSocket {
    return this._client as any;
  }

  constructor(props: WebSocketClientProps) {

  }

  configure(props: WebSocketClientProps) {
    // 'ws://www.host.com/path'

    this._client = new WebSocket(props.url, {
    });
  }

  onOpen(cb: () => void) {
    this.client.on('open', cb);
  }

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

export default class WebSocketClient implements WebSocketClientIo {
  newClient(props: WebSocketClientProps): WSClient {
    return new WSClient(props);
  }
}
