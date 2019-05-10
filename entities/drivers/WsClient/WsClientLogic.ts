import WebSocketClientIo, {
  OnMessageHandler,
  WebSocketClientProps,
  wsEventNames
} from 'system/interfaces/io/WebSocketClientIo';
import {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';


export interface WsClientLogicProps {
  url: string;
  // allow reconnect
  autoReconnect: boolean;
  // waiting before new reconnection trying. 0 or less means don't wait. In ms.
  reconnectTimeoutMs: number;
  // reconnect times. -1 = infinity. 0 means none.
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
    this.connectionId = this.wsClientIo.newConnection(this.props);

    this.listen();
  }

  destroy() {
    clearTimeout(this.reconnectTimeout);
    this.wsClientIo.close(this.connectionId, 0, 'Closing on destroy');
    delete this.openPromiseResolve;
    this.openPromiseReject && this.openPromiseReject();
    delete this.openPromiseReject;
    delete this.openPromise;
    delete this.reconnectTimeout;
  }


  // TODO: что если нет текущего открытого соединения??? - повешать в очередь или вернуть ошибку ?

  async send(data: string | Uint8Array): Promise<void> {

    // TODO: почему не добавляется тип ???

    return this.wsClientIo.send(this.connectionId, data);
  }

  close(code: number, reason?: string) {
    this.wsClientIo.close(this.connectionId, code, reason);

    // TODO: вызвать onClose()

  }

  // TODO: наверное нужна отдельная прослойка так как инстанс соединения убивается при закрытии

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
    this.wsClientIo.onUnexpectedResponse(this.connectionId, (response: ConnectionParams) => {
      this.logError(
        `The unexpected response has been received on ` +
        `connection "${this.connectionId}": ${JSON.stringify(response)}`
      );
    });
  }

  private handleConnectionOpen = () => {
    this.connectionTries = 0;
    this.wasPrevOpenFulfilled = true;
    this.openPromiseResolve();
    this.logInfo(`WsClientLogic: connection opened. ${this.props.url} Id: ${this.connectionId}`);
  }

  /**
   * Trying to reconnect on connection closed.
   */
  private handleConnectionClose = () => {

    // TODO: проверить действительно ли сработает close если даже соединение не открывалось

    this.logInfo(`WsClientLogic: connection closed. ${this.props.url} Id: ${this.connectionId}`);

    // close connection and don't do reconnect if autoReconnect=false or no max tries or tries are exceeded
    // if tries more than -1(infinity) - increment it and close connection if can't connect
    // 0 means none
    if (
      !this.props.autoReconnect
      || this.props.maxTries === 0
      || (this.props.maxTries > 0 && this.connectionTries >= this.props.maxTries)
    ) {
      return this.finallyCloseConnection();
    }

    this.reconnect();
  }

  private reconnect() {
    // TODO: что если не получилось переконнектиться
    // TODO: поидее после реконнекта мы можем ожидать соединения 60 сек - не нужно создавать новое

    // do nothing if current reconnection is in progress
    if (this.reconnectTimeout) return;

    // increment connection tries if maxTries is set
    if (this.props.maxTries >= 0) this.connectionTries++;

    // reconnecting...

    // make new promise if previous was fulfilled
    if (this.wasPrevOpenFulfilled) this.openPromise = this.makeOpenPromise();
    // reconnect immediately if reconnectTimeoutMs = 0 or less
    if (this.props.reconnectTimeoutMs <= 0) return this.doReconnect();

    this.logInfo(`WsClientLogic: Wait ${this.props.reconnectTimeoutMs} ms to reconnect`);
    this.reconnectTimeout = setTimeout(this.doReconnect, this.props.reconnectTimeoutMs);
  }

  private doReconnect = () => {
    delete this.reconnectTimeout;
    this.logInfo(`WsClientLogic: Reconnecting connection "${this.connectionId}" ...`);
    // try to reconnect and save current connectionId
    this.wsClientIo.reConnect(this.connectionId, this.props);
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

  // private makeIoProps(): WebSocketClientProps {
  //   return {
  //     url: this.props.url,
  //     //url: `ws://${this.props.host}:${this.props.port}?clientid=${this.props.clientId}`,
  //     // additional io client params
  //     //...omit(this.props, 'host', 'port')
  //   };
  // }
  
}