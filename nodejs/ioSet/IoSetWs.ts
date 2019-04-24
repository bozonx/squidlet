import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';
import _omit = require('lodash/omit');

import RemoteIoBase from '../../system/ioSet/RemoteIoBase';
import IoSet from '../../system/interfaces/IoSet';
import System from '../../system/System';
import RemoteCallMessage from '../../system/interfaces/RemoteCallMessage';


export interface WsClientProps {
  host: string;
  port: number;
}


export default class IoSetWs extends RemoteIoBase implements IoSet {
  private wsClientProps: WsClientProps;
  private _client?: WebSocket;
  private get client(): WebSocket {
    return this._client as any;
  }


  constructor(wsClientProps: WsClientProps) {
    super();
    this.wsClientProps = wsClientProps;
  }

  async init(system: System): Promise<void> {
    super.init(system);

    const url = `ws://${this.wsClientProps.host}:${this.wsClientProps.port}?hostid=${this.system.host.id}`;

    this._client = new WebSocket(url, _omit(this.wsClientProps, 'host', 'port'));

    this.listen();

    delete this.wsClientProps;
  }


  protected async send(message: RemoteCallMessage): Promise<void> {
    return this.client.send(message);
  }


  destroy() {
    this.client.close(0, 'Closing on destroy');
  }


  protected listen() {
    this.client.on('close', (code: number, reason: string) => {
      // TODO: reconnect
    });

    this.client.on('error', (err: Error) => {
      this.system.log.error(`ERROR: ${err}`);
    });

    this.client.on('message', this.parseIncomeMessage);

    this.client.on('open', () => {
      // TODO: resolve promise
    });

    this.client.on('unexpected-response', (request: ClientRequest, responce: IncomingMessage) => {
      this.system.log.error(`Unexpected response has been received: ${responce.statusCode}: ${responce.statusMessage}`);
    });
  }

  private parseIncomeMessage = async (data: string | Buffer | Buffer[] | ArrayBuffer) => {
    let message: RemoteCallMessage;

    if (typeof data !== 'string') {
      return this.system.log.error(`Websocket io set: invalid type of received data "${typeof data}"`);
    }

    try {
      message = JSON.parse(data);
    }
    catch (err) {
      return this.system.log.error(`Websocket io set: can't parse received json`);
    }

    await this.resolveIncomeMessage(message);
  }

}
