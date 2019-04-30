import WebSocketClientIo, {WebSocketClientProps} from 'system/interfaces/io/WebSocketClientIo';


export type IncomeDataHandler = (data: string | Uint8Array) => void;


/**
 * Websocket client simplified interface.
 * It makes only one connection to one host.
 * It can automatically reconnect if "autoReconnect" param is true.
 */
export default class WsClientLogic {
  private readonly props: WebSocketClientProps;
  private readonly connectionId: string;
  private readonly wsClientIo: WebSocketClientIo;
  private readonly autoReconnect: boolean;
  private readonly onClose: () => void;
  private readonly logInfo: (message: string) => void;
  private readonly logError: (message: string) => void;


  constructor(
    wsClientIo: WebSocketClientIo,
    host: string,
    port: number,
    clientId: string,
    autoReconnect: boolean,
    // It rises a handler only if connection is really closed. It doesn't rise it on reconnect.
    // It's better to destroy this instance and make new one if need.
    onClose: () => void,
    logInfo: (message: string) => void,
    logError: (message: string) => void,
  ) {
    this.wsClientIo = wsClientIo;
    this.autoReconnect = autoReconnect;
    this.onClose = onClose;
    this.logInfo = logInfo;
    this.logError = logError;
    this.props = {
      url: `ws://${host}:${port}?clientId=${clientId}`,
      // additional io client params
      //...omit(this.props, 'host', 'port')
    };

    // TODO: make open connection promise

    this.connectionId = this.wsClientIo.newConnection(this.props);

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

  removeMessageListener(handlerId: number) {
    this.wsClientIo.removeEventListener(this.connectionId, 'message', handlerId);
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
        this.wsClientIo.destroyConnection(this.connectionId);

        return this.onClose();
      }

      // TODO: renew open connection promise
      // TODO: переконекчиваться регулярно каждые 10 секунд

      this.logInfo(`WebSocketClient: Reconnecting...`);
      this.wsClientIo.reConnect(this.connectionId);
    });
  }

}
