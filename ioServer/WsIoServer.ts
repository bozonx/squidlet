import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';
import * as querystring from 'querystring';

import RemoteIoBase from '../system/ioSet/RemoteIoBase';
import IoSet from '../system/interfaces/IoSet';
import System from '../system/System';
import RemoteCallMessage from '../system/interfaces/RemoteCallMessage';


export default class WsIoSet extends RemoteIoBase implements IoSet {
  private readonly server: WebSocket.Server;
  private connections: {[index: string]: WebSocket} = {};


  constructor(system: System) {
    super(system);

    // TODO: set connection params from config

    this.server = new WebSocket.Server({
      host: 'localhost',
      port: 8999,
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
    this.server.on('close', (code: number, reason: string) => {
      // TODO: what to do???
    });

    this.server.on('error', (err: Error) => {
      this.system.log.error(`Websocket io set has received an error: ${err}`);
    });

    // this.server.on('listening', () => {
    // });

    this.server.on('connection', this.onConnection);
  }

  private onConnection = (socket: WebSocket, request: IncomingMessage) => {
    const splitUrl: string[] = (request.url as any).split('?');
    const getParams: {hostid: string} = querystring.parse(splitUrl[1]) as any;
    const remoteHostId: string = getParams.hostid;

    this.connections[remoteHostId] = socket;
    this.listenConnection(remoteHostId);
  }

  private listenConnection(remoteHostId: string) {
    const connection: WebSocket = this.connections[remoteHostId];

    connection.on('close', (code: number, reason: string) => {
      // TODO: what to do???
    });

    connection.on('error', (err: Error) => {
      this.system.log.error(`Websocket io set has received an error: ${err}`);
    });

    connection.on('message', this.parseIncomeMessage);

    connection.on('open', () => {
      // TODO: what to do
    });

    connection.on('unexpected-response', (request: ClientRequest, responce: IncomingMessage) => {
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
