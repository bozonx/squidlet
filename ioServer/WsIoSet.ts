import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';

import RemoteIoBase from '../system/ioSet/RemoteIoBase';
import IoSet from '../system/interfaces/IoSet';
import System from '../system/System';
import RemoteCallMessage from '../system/interfaces/RemoteCallMessage';


export default class WsIoSet extends RemoteIoBase implements IoSet {

  private readonly client: WebSocket;


  constructor(system: System) {
    super(system);

    // TODO: set connection params from config

    const url: string = `ws://localhost:8999?hostid=${this.system.host.id}`;

    this.client = new WebSocket(url, {
    });

    this.listen();
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
      this.system.log.error(`Websocket io set has received an error: ${err}`);
    });

    this.client.on('message', this.parseIncomeMessage);

    this.client.on('open', () => {
      // TODO: resolve promise
    });

    this.client.on('unexpected-response', (request: ClientRequest, responce: IncomingMessage) => {
      this.system.log.error(`Websocket io set has received an unexpected response: ${responce.statusCode}: ${responce.statusMessage}`)
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
