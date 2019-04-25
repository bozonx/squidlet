import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';
import _omit = require('lodash/omit');
import IndexedEvents from '../system/helpers/IndexedEvents';


type IncomeDataHandler = (message: {[index: string]: any}) => void;

export interface WsClientProps {
  host: string;
  port: number;
}


export default class WsClientWrapper {
  private readonly incomeDataEvents = new IndexedEvents<IncomeDataHandler>();
  private readonly logError: (msg: string) => void;
  private _client?: WebSocket;
  private get client(): WebSocket {
    return this._client as any;
  }


  constructor(hostId: string, wsClientProps: WsClientProps, logError: (msg: string) => void) {
    this.logError = logError;

    const url = `ws://${wsClientProps.host}:${wsClientProps.port}?hostid=${hostId}`;

    this._client = new WebSocket(url, _omit(wsClientProps, 'host', 'port'));

    this.listen();
  }


  async send(message: {[index: string]: any}): Promise<void> {
    return this.client.send(message);
  }

  onIncomeMessage(cb: IncomeDataHandler) {
    this.incomeDataEvents.addListener(cb);
  }

  async destroy() {
    this.client.close(0, 'Closing on destroy');
    delete this._client;
  }


  private listen() {
    this.client.on('close', (code: number, reason: string) => {
      // TODO: reconnect
    });

    this.client.on('error', (err: Error) => {
      this.logError(`ERROR: ${err}`);
    });

    this.client.on('message', this.parseIncomeMessage);

    this.client.on('open', () => {
      // TODO: resolve promise
    });

    this.client.on('unexpected-response', (request: ClientRequest, responce: IncomingMessage) => {
      this.logError(`Unexpected response has been received: ${responce.statusCode}: ${responce.statusMessage}`);
    });
  }

  private parseIncomeMessage = async (data: string | Buffer | Buffer[] | ArrayBuffer) => {
    let message: {[index: string]: any};

    if (typeof data !== 'string') {
      return this.logError(`Websocket client: invalid type of received data "${typeof data}"`);
    }

    try {
      message = JSON.parse(data);
    }
    catch (err) {
      return this.logError(`Websocket client: can't parse received json`);
    }

    await this.incomeDataEvents.emit(message);
  }

}
