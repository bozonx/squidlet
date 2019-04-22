import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';
import * as querystring from 'querystring';

import RemoteCallMessage, {REMOTE_CALL_MESSAGE_TYPES} from '../system/interfaces/RemoteCallMessage';
import {isPlainObject} from '../system/helpers/lodashLike';
import RemoteCall, {ObjectToCall} from '../system/helpers/RemoteCall';
import hostDefaultConfig from '../hostEnvBuilder/configs/hostDefaultConfig';


const REMOTECALL_POSITION = 0;
const WS_POSITION = 1;
const WS_SERVER_HOST_ID = 'wsServer';

type ConnectionItem = [RemoteCall, WebSocket];

export interface WsServerProps {
  host: string;
  port: number;
}


export default class WsIoServer {
  private readonly server: WebSocket.Server;
  private readonly ioSet: {[index: string]: ObjectToCall};
  private connections: {[index: string]: ConnectionItem} = {};


  constructor(serverProps: WsServerProps, ioSet: {[index: string]: ObjectToCall}) {
    this.ioSet = ioSet;
    this.server = new WebSocket.Server(serverProps);

    this.listen();
  }


  private listen() {
    this.server.on('close', (code: number, reason: string) => {
      // TODO: what to do???
    });

    this.server.on('error', (err: Error) => {
      console.error(`Websocket io set has received an error: ${err}`);
    });

    // this.server.on('listening', () => {
    // });

    this.server.on('connection', this.onConnection);
  }

  private onConnection = (socket: WebSocket, request: IncomingMessage) => {
    const splitUrl: string[] = (request.url as any).split('?');
    const getParams: {hostid: string} = querystring.parse(splitUrl[1]) as any;
    const remoteHostId: string = getParams.hostid;
    const sendToClient = async (message: RemoteCallMessage): Promise<void> => {
      return socket.send(message);
    };

    const remoteCall = new RemoteCall(
      sendToClient,
      this.ioSet,
      WS_SERVER_HOST_ID,
      hostDefaultConfig.config.devSetResponseTimout,
      console.error,
      this.generateUniqId
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
      console.error(`Websocket io set has received an error: ${err}`);
    });

    connection.on('message', (...params: any[]) => this.parseIncomeMessage(remoteHostId, ...params));

    connection.on('open', () => {
      // TODO: what to do
    });

    connection.on('unexpected-response', (request: ClientRequest, responce: IncomingMessage) => {
      console.error(`Websocket io set has received an unexpected response: ${responce.statusCode}: ${responce.statusMessage}`);
    });
  }

  private parseIncomeMessage = async (remoteHostId: string, data: string | Buffer | Buffer[] | ArrayBuffer) => {
    let message: RemoteCallMessage;

    if (typeof data !== 'string') {
      return console.error(`Websocket io set: invalid type of received data "${typeof data}"`);
    }

    try {
      message = JSON.parse(data);
    }
    catch (err) {
      return console.error(`Websocket io set: can't parse received json`);
    }

    if (!isPlainObject(message)) {
      return console.error(`Io set: received message is not an object`);
    }
    else if (!message.type || !REMOTE_CALL_MESSAGE_TYPES.includes(message.type)) {
      return console.error(`Io set: incorrect type of message ${JSON.stringify(message)}`);
    }

    const remoteCall: RemoteCall = this.connections[remoteHostId][REMOTECALL_POSITION];

    await remoteCall.incomeMessage(message);
  }

  private generateUniqId() {
    // TODO: !!!!
  }

}
