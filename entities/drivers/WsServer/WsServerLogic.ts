import WebSocketServerIo, {ConnectionParams, WebSocketServerProps} from 'system/interfaces/io/WebSocketServerIo';
import IndexedEventEmitter from 'system/helpers/IndexedEventEmitter';


export enum WS_SERVER_EVENTS {
  incomeMessage,
  closeConnection,
  newConnection,
}


export default class WsServerLogic {
  private readonly events = new IndexedEventEmitter<(...args: any[]) => void>();

  // it fulfils when server is start listening
  listeningPromise: Promise<void>;

  private readonly wsServerIo: WebSocketServerIo;
  private readonly props: WebSocketServerProps;
  private readonly onClose: () => void;
  private readonly logInfo: (message: string) => void;
  private readonly logError: (message: string) => void;
  private serverId: string = '';
  private listeningPromiseResolve: () => void = () => {};


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
    this.listeningPromise = new Promise<void>((resolve) => {
      this.listeningPromiseResolve = resolve;
    });
  }

  /**
   * Start server
   */
  init() {
    this.serverId = this.wsServerIo.newServer({
      host: this.props.host,
      port: this.props.port,
    });

    this.listenServer();

    // TODO: add timeout if server doesn't start listen and rise a promise reject
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

  /**
   * Force closing a connection
   */
  closeConnection(connectionId: string, code: number, reason: string) {
    this.wsServerIo.close(this.serverId, connectionId, code, reason);
  }

  // /**
  //  * Listen income messages
  //  */
  // onMessage(connectionId: string, cb: OnMessageHandler): number {
  //   const handler = (receivedConnectionId: string, data: string | Uint8Array) => {
  //     if (connectionId === receivedConnectionId) cb(data);
  //   };
  //
  //   return this.events.addListener(WS_SERVER_EVENTS.incomeMessage, handler);
  // }

  /**
   * Listen income messages
   */
  onMessage(cb: (connectionId: string, data: string | Uint8Array) => void): number {
    return this.events.addListener(WS_SERVER_EVENTS.incomeMessage, cb);
  }

  /**
   * It rises when new connection is come.
   */
  onConnection(cb: (connectionId: string, connectionParams: ConnectionParams) => void): number {
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


  private listenServer() {
    this.wsServerIo.onConnection(this.serverId, this.onIncomeConnection);
    this.wsServerIo.onServerListening(this.serverId, this.listeningPromiseResolve);
    this.wsServerIo.onServerClose(this.serverId, () => this.onClose());
    this.wsServerIo.onServerError(this.serverId, (err: Error) => this.logError(String(err)));
  }

  /**
   * Start listen connection's events
   */
  private onIncomeConnection = (connectionId: string, connectionParams: ConnectionParams) => {
    // rise a new connection events
    this.events.emit(WS_SERVER_EVENTS.newConnection, connectionId, connectionParams);

    this.wsServerIo.onMessage(this.serverId, connectionId, (data: string | Uint8Array) => {
      this.events.emit(WS_SERVER_EVENTS.incomeMessage, connectionId, data);
    });

    this.wsServerIo.onClose(this.serverId, connectionId, () => {
      this.events.emit(WS_SERVER_EVENTS.closeConnection, connectionId);
    });

    this.wsServerIo.onError(this.serverId, connectionId, (err: Error) => this.logError(String(err)));
    this.wsServerIo.onUnexpectedResponse(this.serverId, connectionId, (response: ConnectionParams) => {
      this.logError(
        `Unexpected response has been received on server "${this.serverId}", ` +
        `connection "${connectionId}": ${JSON.stringify(response)}`
      );
    });
  }

}
