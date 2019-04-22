import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';
import * as querystring from 'querystring';

import System from '../system/System';
import RemoteCallMessage, {REMOTE_CALL_MESSAGE_TYPES} from '../system/interfaces/RemoteCallMessage';
import {isPlainObject} from '../system/helpers/lodashLike';
import RemoteCall from '../system/helpers/RemoteCall';


//const SERVER_SENDERID = 'server';

const REMOTECALL_POSITION = 0;
const WS_POSITION = 1;

type ConnectionItem = [RemoteCall, WebSocket];


export default class WsIoServer {
  protected readonly system: System;
  private readonly server: WebSocket.Server;
  private connections: {[index: string]: ConnectionItem} = {};


  constructor(system: System) {
    this.system = system;
    // TODO: set connection params from config

    this.server = new WebSocket.Server({
      host: 'localhost',
      port: 8999,
    });

    this.listen();
  }


  // protected send(message: RemoteCallMessage): any {
  //   //this.client.send(message);
  // }
  //
  //
  // destroy() {
  //   //this.client.close(0, 'Closing on destroy');
  // }


  private listen() {
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

    const remoteCall = new RemoteCall(
      this.send,
      // TODO: add local methods ????
      {},
      this.system.host.id,
      this.system.host.config.config.devSetResponseTimout,
      this.system.log.error,
      this.system.host.generateUniqId
    );

    this.connections[remoteHostId] = [remoteCall, socket];

    this.listenConnection(remoteHostId);
  }

  private listenConnection(remoteHostId: string) {
    const connection: WebSocket = this.connections[remoteHostId][WS_POSITION];

    connection.on('close', (code: number, reason: string) => {
      // TODO: what to do???
    });

    connection.on('error', (err: Error) => {
      this.system.log.error(`Websocket io set has received an error: ${err}`);
    });

    connection.on('message', (...params: any[]) => this.parseIncomeMessage(remoteHostId, ...params));

    connection.on('open', () => {
      // TODO: what to do
    });

    connection.on('unexpected-response', (request: ClientRequest, responce: IncomingMessage) => {
      this.system.log.error(`Websocket io set has received an unexpected response: ${responce.statusCode}: ${responce.statusMessage}`)
    });
  }

  private parseIncomeMessage = async (remoteHostId: string, data: string | Buffer | Buffer[] | ArrayBuffer) => {
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

    if (!isPlainObject(message)) {
      return this.system.log.error(`Io set: received message is not an object`);
    }
    else if (!message.type || !REMOTE_CALL_MESSAGE_TYPES.includes(message.type)) {
      return this.system.log.error(`Io set: incorrect type of message ${JSON.stringify(message)}`);
    }

    // TODO: имеет значение hostId - нужно распределять ответы по каждому соединению
    await this.remoteCall.incomeMessage(message);
  }

}
