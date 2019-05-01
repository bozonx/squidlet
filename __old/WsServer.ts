import * as WebSocket from 'ws';
import {ClientRequest, IncomingMessage} from 'http';
import * as querystring from 'querystring';
import IndexedEvents from '../system/helpers/IndexedEvents';
import {isPlainObject} from '../system/helpers/lodashLike';


type IncomeDataHandler = (remoteHostId: string, message: {[index: string]: any}) => void;
type NewConnectionHandler = (remoteHostId: string, socket: WebSocket, request: IncomingMessage) => void;
type ErrorHandler = (err: string) => void;

export interface WsServerProps {
  host: string;
  port: number;
}


export default class WsServer {
  private readonly incomeDataEvents = new IndexedEvents<IncomeDataHandler>();
  private readonly newConnectionEvents = new IndexedEvents<NewConnectionHandler>();
  private readonly errorEvents = new IndexedEvents<ErrorHandler>();
  private readonly server: WebSocket.Server;
  private readonly verbose: boolean;
  private connections: {[index: string]: WebSocket} = {};


  constructor(serverProps: WsServerProps, verbose?: boolean) {
    this.server = new WebSocket.Server(serverProps);
    this.verbose = Boolean(verbose);

    this.listen();
  }


  send(remoteHostId: string, message: {[index: string]: any}) {
    const socket: WebSocket | undefined = this.connections[remoteHostId];

    if (!socket) {
      throw new Error(`Client "${remoteHostId}" isn't connected`);
    }

    socket.send(message);
  }

  onIncomeMessage(cb: IncomeDataHandler) {
    // TODO: pass host id
    this.incomeDataEvents.addListener(cb);
  }

  onConnection(cb: NewConnectionHandler) {
    this.newConnectionEvents.addListener(cb);
  }

  onError(cb: ErrorHandler) {
    this.errorEvents.addListener(cb);
  }


  private listen() {
    this.server.on('close', (code: number, reason: string) => {
      console.info(`Websocket server closed: ${code}: ${reason}`);
    });

    this.server.on('error', (err: Error) => {
      this.errorEvents.emit(`Websocket io set has received an error: ${err}`);
    });

    this.server.on('listening', () => {
      console.info(`Http server started listening`);
    });

    this.server.on('connection', this.handleIncomeConnection);
  }

  private handleIncomeConnection = (socket: WebSocket, request: IncomingMessage) => {
    const splitUrl: string[] = (request.url as any).split('?');
    const getParams: {hostid: string} = querystring.parse(splitUrl[1]) as any;
    const remoteHostId: string = getParams.hostid;

    this.connections[remoteHostId] = socket;

    this.listenConnection(remoteHostId);
    this.newConnectionEvents.emit(remoteHostId, socket, request);
  }

  private listenConnection(remoteHostId: string) {
    const connection: WebSocket = this.connections[remoteHostId];

    connection.on('close', (code: number, reason: string) => {
      console.info(`Websocket client "${remoteHostId}" closed the connection: ${code}: ${reason}`);
    });

    connection.on('error', (err: Error) => {
      this.errorEvents.emit(`ERROR: ${err}`);
    });

    connection.on('message', (...params: any[]) => this.parseIncomeMessage(remoteHostId, ...params));

    connection.on('open', () => {
      console.info(`Websocket client "${remoteHostId}" opened the connection`);
    });

    connection.on('unexpected-response', (request: ClientRequest, responce: IncomingMessage) => {
      this.errorEvents.emit(`Unexpected response has been received: ${responce.statusCode}: ${responce.statusMessage}`);
    });
  }

  private parseIncomeMessage = async (remoteHostId: string, data?: string | Buffer | Buffer[] | ArrayBuffer) => {
    let message: {[index: string]: any};

    if (typeof data !== 'string') {
      return this.errorEvents.emit(`Websocket server: invalid type of received data "${typeof data}" from "${remoteHostId}"`);
    }

    try {
      message = JSON.parse(data);
    }
    catch (err) {
      return this.errorEvents.emit(`Websocket server: can't parse received json from "${remoteHostId}"`);
    }

    if (!isPlainObject(message)) {
      return this.errorEvents.emit(`Io set: received message is not an object`);
    }

    if (this.verbose) {
      console.info(`Received message from ${remoteHostId}: ${message}`);
    }

    this.incomeDataEvents.emit(remoteHostId, message);
  }

}
