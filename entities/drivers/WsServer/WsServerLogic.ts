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
  async init() {
    this.serverId = await this.wsServerIo.newServer({
      host: this.props.host,
      port: this.props.port,
    });

    await this.listenServer();

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
  closeConnection(connectionId: string, code: number, reason: string): Promise<void> {
    return this.wsServerIo.close(this.serverId, connectionId, code, reason);
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
  onConnection(
    cb: (connectionId: string, request: ConnectionParams) => void
  ): number {
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


  private async listenServer() {
    await this.wsServerIo.onConnection(this.serverId, this.onIncomeConnection);
    await this.wsServerIo.onServerListening(this.serverId, this.listeningPromiseResolve);
    await this.wsServerIo.onServerClose(this.serverId, () => this.onClose());
    await this.wsServerIo.onServerError(this.serverId, (err: Error) => this.logError(String(err)));
  }

  /**
   * Start listen connection's events
   */
  private onIncomeConnection = async (
    connectionId: string, request: ConnectionParams
  ) => {
    // rise a new connection events
    this.events.emit(WS_SERVER_EVENTS.newConnection, connectionId, request);

    try {
      await this.wsServerIo.onMessage(this.serverId, connectionId, (data: string | Uint8Array) => {
        this.events.emit(WS_SERVER_EVENTS.incomeMessage, connectionId, data);
      });

      await this.wsServerIo.onClose(this.serverId, connectionId, () => {
        this.events.emit(WS_SERVER_EVENTS.closeConnection, connectionId);
      });

      await this.wsServerIo.onError(this.serverId, connectionId, (err: Error) => this.logError(String(err)));
      await this.wsServerIo.onUnexpectedResponse(this.serverId, connectionId, (response: ConnectionParams) => {
        this.logError(
          `Unexpected response has been received on server "${this.serverId}", ` +
          `connection "${connectionId}": ${JSON.stringify(response)}`
        );
      });
    }
    catch (err) {
      this.logError(err);
    }
  }

}
