import WebSocketClientIo, {
  OnMessageHandler,
  WebSocketClientProps,
  wsEventNames
} from 'system/interfaces/io/WebSocketClientIo';


export interface WsClientLogicProps {
  // host: string;
  // port: number;
  url: string;
  autoReconnect: boolean;
  reconnectTimeoutMs: number;
  maxTries: number;
}


/**
 * Websocket client simplified interface.
 * It can automatically reconnect if "autoReconnect" param is true.
 */
export default class WsClientLogic {
  // on first time connect or reconnect
  openPromise: Promise<void>;

  private readonly wsClientIo: WebSocketClientIo;
  private readonly props: WsClientLogicProps;
  private readonly onClose: () => void;
  private readonly logInfo: (message: string) => void;
  private readonly logError: (message: string) => void;
  private readonly connectionId: string;
  private openPromiseResolve: () => void = () => {};
  private openPromiseReject: () => void = () => {};
  // was previous open promise fulfilled
  private wasPrevOpenFulfilled: boolean = false;
  private connectionTries: number = 0;
  private reconnectTimeout: any;


  constructor(
    wsClientIo: WebSocketClientIo,
    props: WsClientLogicProps,
    // It rises a handler only if connection is really closed. It doesn't rise it on reconnect.
    // It's better to destroy this instance and make new one if need.
    onClose: () => void,
    logInfo: (message: string) => void,
    logError: (message: string) => void,
  ) {
    this.wsClientIo = wsClientIo;
    this.props = props;
    this.onClose = onClose;
    this.logInfo = logInfo;
    this.logError = logError;

    this.openPromise = this.makeOpenPromise();
    // make new connection and save connectionId of it
    this.connectionId = this.wsClientIo.newConnection(this.makeIoProps());

    this.listen();
  }

  destroy() {
    clearTimeout(this.reconnectTimeout);
    this.wsClientIo.close(this.connectionId, 0, 'Closing on destroy');
    delete this.openPromiseResolve;
    delete this.openPromiseReject;
    delete this.openPromise;
    delete this.reconnectTimeout;
  }


  async send(data: string | Uint8Array): Promise<void> {
    return this.wsClientIo.send(this.connectionId, data);
  }

  close(code: number, reason?: string) {
    this.wsClientIo.close(this.connectionId, code, reason);

    // TODO: вызвать onClose()

  }

  onMessage(cb: OnMessageHandler): number {
    return this.wsClientIo.onMessage(this.connectionId, cb);
  }

  removeMessageListener(handlerId: number) {
    this.wsClientIo.removeEventListener(this.connectionId, wsEventNames.message, handlerId);
  }


  private listen() {
    this.wsClientIo.onOpen(this.connectionId, this.handleConnectionOpen);
    this.wsClientIo.onClose(this.connectionId, this.handleConnectionClose);
    this.wsClientIo.onError(this.connectionId, (err: Error) => this.logError(String(err)));
    this.wsClientIo.onUnexpectedResponse(this.connectionId, (request, response) => {
      this.logError(`The unexpected response has been received on connection "${this.connectionId}": ` +
        `${response.statusCode}: ${response.statusMessage}`);
    });
  }

  private handleConnectionOpen = () => {
    this.connectionTries = 0;
    this.wasPrevOpenFulfilled = true;
    this.openPromiseResolve();
    this.logInfo(`WsClientLogic: connection opened. ${this.makeIoProps().url} Id: ${this.connectionId}`);
  }

  /**
   * Trying to reconnect on connection closed.
   */
  private handleConnectionClose = () => {
    this.logInfo(`WsClientLogic: connection closed. ${this.makeIoProps().url} Id: ${this.connectionId}`);

    if (!this.props.autoReconnect) return this.finallyCloseConnection();

    this.reconnect();
  }

  private reconnect() {

    // TODO: review
    // TODO: maxTries 0 means none
    // TODO: reconnectTimeoutMs что если 0 и меньше
    // TODO: проверить действительно ли сработает close если даже соединение не открывалось

    // do nothing if current reconnection is in progress
    if (this.reconnectTimeout) return;

    // if tries more than -1(infinity) - increment it and close connection if can't connect
    // 0 means none
    if (this.props.maxTries >= 0) {
      if (this.connectionTries >= this.props.maxTries) {
        return this.finallyCloseConnection();
      }

      this.connectionTries++;
    }

    // make new promise if previous was fulfilled
    if (this.wasPrevOpenFulfilled) {
      this.openPromise = this.makeOpenPromise();
    }

    this.logInfo(`WsClientLogic: Wait ${this.props.reconnectTimeoutMs} ms to reconnect`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = undefined;
      this.logInfo(`WsClientLogic: Reconnecting...`);

      this.wsClientIo.reConnect(this.connectionId, this.makeIoProps());
    }, this.props.reconnectTimeoutMs);
  }

  private finallyCloseConnection() {
    this.wsClientIo.close(this.connectionId, 0);

    // reject open promise if connection hasn't been established
    if (!this.wasPrevOpenFulfilled) {
      this.wasPrevOpenFulfilled = true;
      this.openPromiseReject();
    }

    return this.onClose();
  }

  private makeOpenPromise(): Promise<void> {
    this.wasPrevOpenFulfilled = false;
    
    return new Promise<void>((resolve, reject) => {
      this.openPromiseResolve = resolve;
      this.openPromiseReject = reject;
    });
  }

  private makeIoProps(): WebSocketClientProps {
    return {
      url: this.props.url,
      //url: `ws://${this.props.host}:${this.props.port}?clientid=${this.props.clientId}`,
      // additional io client params
      //...omit(this.props, 'host', 'port')
    };
  }
  
}
