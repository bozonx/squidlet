import WebSocketServerIo, {ConnectionParams, WebSocketServerProps} from 'system/interfaces/io/WebSocketServerIo';
import IndexedEventEmitter from 'system/helpers/IndexedEventEmitter';
import Promised from '../../../system/helpers/Promised';


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
    this.serverId = await this.wsServerIo.newServer(this.props);

    await this.listenServerEvents();
    await this.listenConnectionEvents();
  }

  async destroy() {
    if (!this.isInitialized()) {
      return this.logError(`WsServerLogic.destroy: Server hasn't been initialized yet.`);
    }

    await this.wsServerIo.closeServer(this.serverId);
  }


  isInitialized(): boolean {
    return !this.serverId;
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
   * Force closing a connection
   */
  closeConnection(connectionId: string, code: number, reason: string): Promise<void> {
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
      this._listeningPromised.reject(new Error(`Server hasn't been started. Timeout has been exceeded`));
      this.wsServerIo.closeServer(this.serverId)
        .catch(this.logError);
    }, SERVER_START_LISTENING_SEC * 1000);

    await this.wsServerIo.onServerListening(this.serverId, () => {
      clearTimeout(listeningTimeout);
      this._listeningPromised.resolve();
    });

    await this.wsServerIo.onConnection(this.serverId, (connectionId: string, request: ConnectionParams) => {
      this.events.emit(WS_SERVER_EVENTS.newConnection, connectionId, request);
    });

    await this.wsServerIo.onServerClose(this.serverId, () => this.onClose());
    await this.wsServerIo.onServerError(this.serverId, (err: Error) => this.logError(String(err)));
  }

  private async listenConnectionEvents() {
    await this.wsServerIo.onClose(this.serverId, (connectionId: string) => {
      this.events.emit(WS_SERVER_EVENTS.closeConnection, connectionId);
    });

    await this.wsServerIo.onMessage(this.serverId, (connectionId: string, data: string | Uint8Array) => {
      this.events.emit(WS_SERVER_EVENTS.incomeMessage, connectionId, data);
    });

    await this.wsServerIo.onError(this.serverId, (connectionId: string, err: Error) => this.logError(String(err)));

    await this.wsServerIo.onUnexpectedResponse(this.serverId, (connectionId: string, response: ConnectionParams) => {
      this.logError(
        `Unexpected response has been received on server "${this.serverId}", ` +
        `connection "${connectionId}": ${JSON.stringify(response)}`
      );
    });
  }

}
