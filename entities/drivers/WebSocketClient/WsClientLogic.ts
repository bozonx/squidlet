import WebSocketClientIo from 'system/interfaces/io/WebSocketClientIo';


export type IncomeDataHandler = (data: string | Uint8Array) => void;


/**
 * Websocket client simplified interface.
 * It makes only one connection to one host.
 * It can automatically reconnect if "autoReconnect" param is true.
 */
export default class WsClientLogic {
  private readonly url: string;
  private readonly connectionId: string;
  private readonly wsClientIo: WebSocketClientIo;
  private readonly autoReconnect: boolean;
  private readonly logInfo: (message: string) => void;
  private readonly logError: (message: string) => void;


  constructor(
    wsClientIo: WebSocketClientIo,
    host: string,
    port: number,
    clientId: string,
    autoReconnect: boolean,
    logInfo: (message: string) => void,
    logError: (message: string) => void,
  ) {
    this.wsClientIo = wsClientIo;
    this.autoReconnect = autoReconnect;
    this.logInfo = logInfo;
    this.logError = logError;
    this.url = `ws://${host}:${port}?clientId=${clientId}`;

    // TODO: save props
    // TODO: make open connection promise

    this.connectionId = this.wsClientIo.newConnection({
      url: this.url,
      // additional io client params
      //...omit(this.props, 'host', 'port')
    });

    this.listen();
  }

  destroy() {
    this.wsClientIo.close(this.connectionId, 0, 'Closing on destroy');
  }


  async send(data: string | Uint8Array): Promise<void> {
    return this.wsClientIo.send(this.connectionId, data);
  }

  onMessage(cb: IncomeDataHandler): number {
    return this.wsClientIo.onMessage(this.connectionId, cb);
  }

  /**
   * It rises a handler only if connection is really closed.
   * It doesn't rise it on reconnect.
   */
  onClose(cb: () => void): number {
    // TODO: make it !!!!
  }

  removeMessageListener(handlerId: number) {
    this.wsClientIo.removeEventListener(this.connectionId, 'message', handlerId);
  }

  removeCloseListener(handlerId: number) {
    // TODO: make it !!!!
  }


  private listen() {
    this.wsClientIo.onOpen(this.connectionId, () => {
      return this.logInfo(`WebSocketClient: connection opened. ${this.url} Id: ${this.connectionId}`);
    });

    this.wsClientIo.onError(this.connectionId, (err: string) => {
      return this.logError(err);
    });

    this.wsClientIo.onClose(this.connectionId, () => {
      this.logInfo(`WebSocketClient: connection closed. ${this.url} Id: ${this.connectionId}`);

      if (!this.autoReconnect) {

        // TODO: rise close event

        return;
      }

      // TODO: renew open connection promise
      // TODO: переконекчиваться регулярно каждые 10 секунд

      this.logInfo(`WebSocketClient: Reconnecting...`);
      this.wsClientIo.reConnect(this.connectionId);
    });
  }

}
