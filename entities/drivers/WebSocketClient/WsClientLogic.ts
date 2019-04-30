import WebSocketClientIo, {WebSocketClientProps} from 'system/interfaces/io/WebSocketClientIo';
import {WebSocketClientDriverProps} from './WebSocketClient';


export type IncomeDataHandler = (data: string | Uint8Array) => void;

export interface WsClientLogicProps extends WebSocketClientDriverProps {
  clientId: string;
}


/**
 * Websocket client simplified interface.
 * It makes only one connection to one host.
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
    this.connectionId = this.wsClientIo.newConnection(this.makeIoProps());

    this.listen();
  }

  destroy() {
    clearTimeout(this.reconnectTimeout);
    this.wsClientIo.close(this.connectionId, 0, 'Closing on destroy');
  }


  async send(data: string | Uint8Array): Promise<void> {
    return this.wsClientIo.send(this.connectionId, data);
  }

  onMessage(cb: IncomeDataHandler): number {
    return this.wsClientIo.onMessage(this.connectionId, cb);
  }

  removeMessageListener(handlerId: number) {
    this.wsClientIo.removeEventListener(this.connectionId, 'message', handlerId);
  }


  private listen() {
    this.wsClientIo.onOpen(this.connectionId, this.handleConnectionOpen);
    this.wsClientIo.onClose(this.connectionId, this.handleConnectionClose);
    this.wsClientIo.onError(this.connectionId, (err: string) => this.logError(err));
  }

  private handleConnectionOpen = () => {
    this.connectionTries = 0;
    this.wasPrevOpenFulfilled = true;
    this.openPromiseResolve();
    this.logInfo(`WebSocketClient: connection opened. ${this.makeIoProps().url} Id: ${this.connectionId}`);
  }

  private handleConnectionClose = () => {
    this.logInfo(`WebSocketClient: connection closed. ${this.makeIoProps().url} Id: ${this.connectionId}`);

    if (!this.props.autoReconnect) return this.finallyCloseConnection();

    this.reconnect();
  }

  private reconnect() {

    // TODO: проверить действительно ли сработает close если даже соединение не открывалось

    // do nothing if current reconnection is in progress
    if (this.reconnectTimeout) return;

    // TODO: add infinity tries

    if (this.connectionTries >= this.props.maxTries) {
      return this.finallyCloseConnection();
    }

    // make new promise if previous was fulfilled
    if (this.wasPrevOpenFulfilled) {
      this.openPromise = this.makeOpenPromise();
    }

    this.logInfo(`WebSocketClient: Wait to reconnect ${this.props.reconnectTimeoutSec}`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = undefined;
      this.logInfo(`WebSocketClient: Reconnecting...`);

      this.wsClientIo.reConnect(this.connectionId, this.makeIoProps());
    }, this.props.reconnectTimeoutSec);
  }

  private finallyCloseConnection() {
    this.wsClientIo.destroyConnection(this.connectionId);

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
      url: `ws://${this.props.host}:${this.props.port}?clientId=${this.props.clientId}`,
      // additional io client params
      //...omit(this.props, 'host', 'port')
    };
  }
  
}
