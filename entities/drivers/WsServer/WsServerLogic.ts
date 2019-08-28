import WebSocketServerIo, {
  ConnectionParams,
  WebSocketServerProps,
  WsServerEvent
} from 'system/interfaces/io/WebSocketServerIo';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import Promised from 'system/lib/Promised';
import {HANDLER_EVENT_POSITION, HANDLER_INDEX_POSITION} from 'system/constants';


export enum WS_SERVER_EVENTS {
  incomeMessage,
  closeConnection,
  newConnection,
}

const SERVER_START_LISTENING_SEC = 30;
export const SETCOOKIE_LABEL = '__SET_COOKIE__';


export default class WsServerLogic {
  // it fulfils when server is start listening
  get listeningPromise(): Promise<void> {
    return this._listeningPromised.promise;
  }

  private readonly events = new IndexedEventEmitter<(...args: any[]) => void>();
  private readonly wsServerIo: WebSocketServerIo;
  private readonly props: WebSocketServerProps;
  private readonly onClose: () => void;
  private readonly logInfo: (message: string) => void;
  private readonly logError: (message: string) => void;
  private serverId: string = '';
  private _listeningPromised: Promised<void>;
  private handlerIndexes: [WsServerEvent, number][] = [];


  constructor(
    wsServerIo: WebSocketServerIo,
    props: WebSocketServerProps,
    // It rises a handler only if server is closed.
    // It's better to destroy this instance and make new one if need.
    onClose: () => void,
    logInfo: (message: string) => void,
    logError: (message: string) => void,
  ) {
    this.wsServerIo = wsServerIo;
    this.props = props;
    this.onClose = onClose;
    this.logInfo = logInfo;
    this.logError = logError;
    this._listeningPromised = new Promised<void>();
  }


  /**
   * Start server
   */
  async init() {
    this.logInfo(`... Starting websocket server: ${this.props.host}:${this.props.port}`);
    this.serverId = await this.wsServerIo.newServer(this.props);

    await this.listenServerEvents();
    await this.listenConnectionEvents();
  }

  async destroy() {
    if (!this.isInitialized()) {
      return this.logError(`WsServerLogic.destroy: Server hasn't been initialized yet.`);
    }

    this.events.destroy();
    await this.removeListeners();
    await this.wsServerIo.closeServer(this.serverId);
  }


  isInitialized(): boolean {
    return typeof this.serverId !== 'undefined';
  }

  /**
   * Send message to client
   */
  send(connectionId: string, data: string | Uint8Array): Promise<void> {
    return this.wsServerIo.send(this.serverId, connectionId, data);
  }

  async setCookie(connectionId: string, cookie: string) {
    const data = `${SETCOOKIE_LABEL}${cookie}`;

    return this.wsServerIo.send(this.serverId, connectionId, data);
  }

  /**
   * Force closing a connection.
   * Close event will be risen
   */
  closeConnection(connectionId: string, code: number, reason: string): Promise<void> {
    // TODO: проверить будет ли поднято событие close ???
    return this.wsServerIo.close(this.serverId, connectionId, code, reason);
  }

  /**
   * Listen income messages
   */
  onMessage(cb: (connectionId: string, data: string | Uint8Array) => void): number {
    return this.events.addListener(WS_SERVER_EVENTS.incomeMessage, cb);
  }

  /**
   * It rises when new connection is come.
   */
  onConnection(cb: (connectionId: string, request: ConnectionParams) => void): number {
    return this.events.addListener(WS_SERVER_EVENTS.newConnection, cb);
  }

  /**
   * Listen any connection close
   */
  onConnectionClose(cb: (connectionId: string) => void): number {
    return this.events.addListener(WS_SERVER_EVENTS.closeConnection, cb);
  }

  removeListener(eventName: WS_SERVER_EVENTS, handlerIndex: number) {
    this.events.removeListener(String(eventName), handlerIndex);
  }


  private async listenServerEvents() {
    const listeningTimeout = setTimeout(() => {
      this.handleTimeout()
        .catch(this.logError);
    }, SERVER_START_LISTENING_SEC * 1000);

    const listeningIndex: number = await this.wsServerIo.onServerListening(
      this.serverId,
      () => {
        clearTimeout(listeningTimeout);
        this._listeningPromised.resolve();
      }
    );
    const connectionIndex: number = await this.wsServerIo.onConnection(
      this.serverId,
      (connectionId: string, request: ConnectionParams) => {
        this.events.emit(WS_SERVER_EVENTS.newConnection, connectionId, request);
      }
    );
    const closeIndex: number = await this.wsServerIo.onServerClose(
      this.serverId,
      () => this.onClose()
    );
    const errorIndex: number = await this.wsServerIo.onServerError(this.serverId, (err: Error) => this.logError(String(err)));

    this.handlerIndexes.push([WsServerEvent.listening, listeningIndex]);
    this.handlerIndexes.push([WsServerEvent.newConnection, connectionIndex]);
    this.handlerIndexes.push([WsServerEvent.serverClose, closeIndex]);
    this.handlerIndexes.push([WsServerEvent.serverError, errorIndex]);
  }

  private async listenConnectionEvents() {
    const closeIndex: number = await this.wsServerIo.onClose(
      this.serverId,
      (connectionId: string) => {
        this.events.emit(WS_SERVER_EVENTS.closeConnection, connectionId);
      }
    );
    const messageIndex: number = await this.wsServerIo.onMessage(
      this.serverId,
      (connectionId: string, data: string | Uint8Array) => {
        this.events.emit(WS_SERVER_EVENTS.incomeMessage, connectionId, data);
      }
    );
    const errorIndex: number = await this.wsServerIo.onError(
      this.serverId,
      (connectionId: string, err: Error) => this.logError(String(err))
    );
    const unexpectedIndex: number = await this.wsServerIo.onUnexpectedResponse(
      this.serverId,
      (connectionId: string, response: ConnectionParams) => {
        this.logError(
          `Unexpected response has been received on server "${this.serverId}", ` +
          `connection "${connectionId}": ${JSON.stringify(response)}`
        );
      }
    );

    this.handlerIndexes.push([WsServerEvent.clientClose, closeIndex]);
    this.handlerIndexes.push([WsServerEvent.clientMessage, messageIndex]);
    this.handlerIndexes.push([WsServerEvent.clientError, errorIndex]);
    this.handlerIndexes.push([WsServerEvent.clientUnexpectedResponse, unexpectedIndex]);
  }

  private async removeListeners() {
    for (let handlerIndex of this.handlerIndexes) {
      await this.wsServerIo.removeEventListener(
        this.serverId,
        handlerIndex[HANDLER_EVENT_POSITION],
        handlerIndex[HANDLER_INDEX_POSITION]
      );
    }
  }

  private async handleTimeout() {
    this._listeningPromised.reject(new Error(`Server hasn't been started. Timeout has been exceeded`));
    await this.removeListeners();
    await this.wsServerIo.closeServer(this.serverId);
  }

}
