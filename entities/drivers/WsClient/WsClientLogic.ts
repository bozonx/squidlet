import WebSocketClientIo, {
  OnMessageHandler, WebSocketClientProps,
} from 'system/interfaces/io/WebSocketClientIo';
import {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';
import IndexedEvents from 'system/lib/IndexedEvents';
import {Primitives} from 'system/interfaces/Types';
import {mergeDeep} from 'system/lib/collections';
import {parseCookie, stringifyCookie} from 'system/lib/strings';
import Promised from 'system/lib/Promised';
import {SETCOOKIE_LABEL} from '../WsServer/WsServerLogic';


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
 * But if connection is closed by calling the close method you should create a new instance to reconnect.
 */
export default class WsClientLogic {
  // on first time connect or reconnect
  get connectedPromise(): Promise<void> {
    if (!this.connectionId || !this.openPromise) {
      throw new Error(`WsClientLogic.connectedPromise: ${this.closedMsg}`);
    }

    return this.openPromise.promise;
  }

  private readonly messageEvents = new IndexedEvents<OnMessageHandler>();
  private readonly wsClientIo: WebSocketClientIo;
  private readonly props: WsClientLogicProps;
  private readonly onClose: () => void;
  private readonly logInfo: (message: string) => void;
  private readonly logError: (message: string) => void;
  private connectionId: string = '';
  // TODO: review logic
  // TODO: where is reject????
  private openPromise: Promised<void>;
  // TODO: review logic
  // was previous open promise fulfilled
  private wasPrevOpenFulfilled: boolean = false;
  private connectionTries: number = 0;
  private reconnectTimeout: any;
  private isConnectionOpened: boolean = false;
  private cookies: {[index: string]: Primitives} = {};
  private waitingCookies: boolean = true;
  // TODO: use in other cases
  private get closedMsg() {
    return `Connection "${this.props.url}" has been closed`;
  }


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
  }

  async init() {
    // make new connection and save connectionId of it
    const connectionProps: WebSocketClientProps = {
      url: this.props.url,
    };

    this.connectionId = await this.wsClientIo.newConnection(connectionProps);

    await this.listen();
    // listen for connection established
    await this.connectedPromise;
  }

  async destroy() {
    await this.wsClientIo.close(this.connectionId, 0, 'Closing on destroy');
    this.destroyInstance();
  }


  isConnected(): boolean {
    return this.isConnectionOpened;
  }

  async send(data: string | Uint8Array): Promise<void> {
    await this.connectedPromise;

    return this.wsClientIo.send(this.connectionId, data);
  }

  async close(code: number, reason?: string) {
    await this.wsClientIo.close(this.connectionId, code, reason);
    this.destroyInstance();
  }

  onMessage(cb: OnMessageHandler): number {
    return this.messageEvents.addListener(cb);
  }

  removeMessageListener(handlerId: number) {
    this.messageEvents.removeListener(handlerId);
  }


  private async listen() {
    await this.wsClientIo.onOpen(this.handleConnectionOpen);
    await this.wsClientIo.onClose(this.handleConnectionClose);
    await this.wsClientIo.onMessage(this.handleMessage);

    await this.wsClientIo.onError((connectionId: string, err: Error) => {
      if (connectionId !== this.connectionId) return;

      this.logError(String(err));
    });

    await this.wsClientIo.onUnexpectedResponse((connectionId: string, response: ConnectionParams) => {
      if (connectionId !== this.connectionId) return;

      this.logError(
        `The unexpected response has been received on ` +
        `connection "${this.connectionId}": ${JSON.stringify(response)}`
      );
    });
  }

  private handleConnectionOpen = (connectionId: string) => {
    if (connectionId !== this.connectionId) return;

    this.connectionTries = 0;
    this.wasPrevOpenFulfilled = true;
    this.isConnectionOpened = true;
    this.waitingCookies = true;
    this.logInfo(`WsClientLogic: connection opened. ${this.props.url} Id: ${this.connectionId}`);
  }

  /**
   * Trying to reconnect on connection closed.
   */
  private handleConnectionClose = (connectionId: string) => {
    if (connectionId !== this.connectionId) return;

    this.isConnectionOpened = false;
    // TODO: проверить действительно ли сработает close если даже соединение не открывалось

    this.logInfo(`WsClientLogic: connection closed. ${this.props.url} Id: ${this.connectionId}`);
    this.resolveReconnection()
      .catch(this.logError);
  }

  private handleMessage = (connectionId: string, data: string | Uint8Array) => {
    if (connectionId !== this.connectionId) return;

    // if the first message is cookie - set it
    if (this.waitingCookies) {
      this.waitingCookies = false;

      this.setCookie(data);
      this.openPromise.resolve();

      return;
    }

    // ordinary message
    this.messageEvents.emit(data);
  }

  /**
   * close connection and don't do reconnect if autoReconnect=false or no max tries or tries are exceeded
   * if tries more than -1(infinity) - increment it and close connection if can't connect
   * 0 means none
   */
  private async resolveReconnection() {
    if (
      !this.props.autoReconnect
      || this.props.maxTries === 0
      || (this.props.maxTries > 0 && this.connectionTries >= this.props.maxTries)
    ) {
      return this.finallyCloseConnection();
    }

    await this.reconnect();
  }

  private async reconnect() {
    // do nothing if current reconnection is in progress
    if (this.reconnectTimeout) return;

    // make new promise if previous was fulfilled
    if (this.wasPrevOpenFulfilled) this.openPromise = this.makeOpenPromise();

    // TODO: нужно тогда опять ждать cookie и потом резолвиться connection promise

    // reconnect immediately if reconnectTimeoutMs = 0 or less
    if (this.props.reconnectTimeoutMs <= 0) return this.doReconnect();

    this.logInfo(`WsClientLogic: Wait ${this.props.reconnectTimeoutMs} ms to reconnect`);
    this.reconnectTimeout = setTimeout(this.doReconnect, this.props.reconnectTimeoutMs);
  }

  private doReconnect = async () => {
    delete this.reconnectTimeout;
    this.logInfo(`WsClientLogic: Reconnecting connection "${this.connectionId}" ...`);

    // TODO: при этом не сработает close ??? или сработает???

    const connectionProps: WebSocketClientProps = {
      url: this.props.url,
      headers: {
        'Cookie': stringifyCookie(this.cookies),
      }
    };

    // try to reconnect and save current connectionId
    try {
      await this.wsClientIo.reConnect(this.connectionId, connectionProps);
    }
    catch (err) {
      this.logError(`WsClientLogic.doReconnect: ${err}. Reconnecting...`);

      // increment connection tries if maxTries is greater than 0
      if (this.props.maxTries >= 0) this.connectionTries++;

      this.resolveReconnection()
        .catch(this.logError);
    }

    this.listen()
      .catch(this.logError);
  }

  /**
   * You can't reconnect anymore after this. You should create a new instance if need.
   */
  private async finallyCloseConnection() {
    await this.wsClientIo.close(this.connectionId, 0);

    // // reject open promise if connection hasn't been established
    // if (!this.wasPrevOpenFulfilled) {
    //   this.wasPrevOpenFulfilled = true;
    //   this.openPromiseReject();
    // }

    this.destroyInstance();

    return this.onClose();
  }

  // TODO: review
  private makeOpenPromise(): Promised<void> {
    this.wasPrevOpenFulfilled = false;

    return new Promised<void>();
  }

  private destroyInstance() {
    this.isConnectionOpened = false;
    this.openPromise.destroy();
    clearTimeout(this.reconnectTimeout);
    delete this.openPromise;
    delete this.reconnectTimeout;
    this.messageEvents.removeAll();
  }

  private setCookie(data: string | Uint8Array) {
    if (typeof data !== 'string' || data.indexOf(SETCOOKIE_LABEL) !== 0) return;

    const [left, cookiePart] = data.split(SETCOOKIE_LABEL);

    try {
      const cookies: {[index: string]: Primitives} = parseCookie(cookiePart);

      this.cookies = mergeDeep(this.cookies, cookies);
    }
    catch (err) {
      return this.logError(`WsClientLogic.setCookie: ${err}`);
    }
  }

}
