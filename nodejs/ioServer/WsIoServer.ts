import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';
import * as querystring from 'querystring';

import RemoteCallMessage, {REMOTE_CALL_MESSAGE_TYPES} from '../../system/interfaces/RemoteCallMessage';
import {isPlainObject} from '../../system/helpers/lodashLike';
import RemoteCall from '../../system/helpers/RemoteCall';
import hostDefaultConfig from '../../hostEnvBuilder/configs/hostDefaultConfig';
import {IoItemClass} from '../../system/interfaces/IoItem';


// TODO: remove
let uniqIndex = 10000;


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
  private readonly ioCollection: {[index: string]: IoItemClass};
  private readonly verbose: boolean;
  private connections: {[index: string]: ConnectionItem} = {};


  constructor(serverProps: WsServerProps, ioCollection: {[index: string]: IoItemClass}, verbose?: boolean) {
    this.ioCollection = ioCollection;
    this.server = new WebSocket.Server(serverProps);
    this.verbose = Boolean(verbose);

    this.listen();
  }


  private listen() {
    this.server.on('close', (code: number, reason: string) => {
      console.info(`Websocket server closed: ${code}: ${reason}`);
    });

    this.server.on('error', (err: Error) => {
      console.error(`Websocket io set has received an error: ${err}`);
    });

    this.server.on('listening', () => {
      console.info(`Http server started listening`);
    });

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
      this.ioSet as any,
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
      console.info(`Websocket client "${remoteHostId}" closed the connection: ${code}: ${reason}`);
    });

    connection.on('error', (err: Error) => {
      console.error(`ERROR: ${err}`);
    });

    connection.on('message', (...params: any[]) => this.parseIncomeMessage(remoteHostId, ...params));

    connection.on('open', () => {
      console.info(`Websocket client "${remoteHostId}" opened the connection`);
    });

    connection.on('unexpected-response', (request: ClientRequest, responce: IncomingMessage) => {
      console.error(`Unexpected response has been received: ${responce.statusCode}: ${responce.statusMessage}`);
    });
  }

  private parseIncomeMessage = async (remoteHostId: string, data?: string | Buffer | Buffer[] | ArrayBuffer) => {
    // TODO: может пытаться отдавать ответ с ошибкой ????

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

    if (this.verbose) {
      console.info(`Received message from ${remoteHostId}: ${message}`);
    }

    const remoteCall: RemoteCall = this.connections[remoteHostId][REMOTECALL_POSITION];

    await remoteCall.incomeMessage(message);
  }

  private generateUniqId(): string {
    uniqIndex++;

    // TODO: make real id generation

    return String(uniqIndex);
  }

}
