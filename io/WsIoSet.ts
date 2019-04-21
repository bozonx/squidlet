import * as WebSocket from 'ws';

import RemoteIoBase from './RemoteIoBase';
import {IoSetMessage} from '../system/interfaces/IoSet';
import {ClientRequest, IncomingMessage} from 'http';
import System from '../system/System';
import {Primitives} from '../system/interfaces/Types';
import IndexedEvents from '../system/helpers/IndexedEvents';




export default class WsIoSet extends RemoteIoBase {

  private readonly client: WebSocket;


  constructor(system: System) {
    super(system);

    // TODO: get params

    this.client = new WebSocket('ws://localhost:8999', {
    });

    this.listen();
  }


  callMethod(ioName: string, method: string, ...args: Primitives[]): Promise<any> {
    const data: IoSetMessage = {
      type: 'call',
      payload: {
        hostId: this.system.host.id,
        method,
        args,
      },
    };

    this.client.send(data);

    return this.waitForCallResponse(ioName, method);
  }

  addCbListener(ioName: string): Promise<void> {

  }

  removeCbListener(ioName: string): Promise<void> {

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

    this.client.on('message', (data: string | Buffer | Buffer[] | ArrayBuffer) => {
      // TODO: понять какой тип сообщения
    });

    this.client.on('open', () => {
      // TODO: resolve promise
    });

    this.client.on('unexpected-response', (request: ClientRequest, responce: IncomingMessage) => {
      this.system.log.error(`Websocket io set has received an unexpected response: ${responce.statusCode}: ${responce.statusMessage}`)
    });
  }

}
