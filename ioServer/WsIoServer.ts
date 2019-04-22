import * as WebSocket from 'ws';

import RemoteIoBase from '../system/ioSet/RemoteIoBase';
import IoSet from '../system/interfaces/IoSet';
import {ClientRequest, IncomingMessage} from 'http';
import System from '../system/System';
import RemoteCallMessage from '../system/interfaces/RemoteCallMessage';


export default class WsIoSet extends RemoteIoBase implements IoSet {
  private readonly server: WebSocket.Server;


  constructor(system: System) {
    super(system);

    // TODO: set connection params

    this.server = new WebSocket.Server({
    });

    this.listen();
  }


  protected send(message: RemoteCallMessage): any {
    //this.client.send(message);
  }


  destroy() {
    //this.client.close(0, 'Closing on destroy');
  }


  protected listen() {
    // this.client.on('close', (code: number, reason: string) => {
    //   // TODO: reconnect
    // });
    //
    // this.client.on('error', (err: Error) => {
    //   this.system.log.error(`Websocket io set has received an error: ${err}`);
    // });
    //
    // this.client.on('message', this.parseIncomeMessage);
    //
    // this.client.on('open', () => {
    //   // TODO: resolve promise
    // });
    //
    // this.client.on('unexpected-response', (request: ClientRequest, responce: IncomingMessage) => {
    //   this.system.log.error(`Websocket io set has received an unexpected response: ${responce.statusCode}: ${responce.statusMessage}`)
    // });
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
