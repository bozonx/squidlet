import WebSocketClientIo from 'system/interfaces/io/WebSocketClientIo';


export type IncomeDataHandler = (data: string | Uint8Array) => void;


/**
 * Websocket client simplified interface.
 * It makes only one connection to one host.
 * It can automatically reconnect if "autoReconnect" param is true.
 */
export default class WsClientLogic {
  private readonly url: string;
  private readonly connectionId: number;
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

    this.connectionId = this.wsClientIo.newConnection({
      url: this.url,
      // additional io client params
      //...omit(this.props, 'host', 'port')
    });

    this.listen();
  }

  destroy() {
    //this.wsClientIo.close(this.connectionId, 0, 'Closing on destroy');

    // TODO: remove listeners
  }


  async send(data: string | Uint8Array): Promise<void> {
    return this.wsClientIo.send(this.connectionId, data);
  }

  onMessage(cb: IncomeDataHandler): number {
    // TODO: return number
    return this.wsClientIo.onMessage(this.connectionId, cb);
  }

  removeMessageListener(handlerId: number) {
    // TODO: make it !!!!
  }


  private listen() {
    this.wsClientIo.onOpen(this.connectionId, () => {
      return this.logInfo(`WebSocketClient: connection opened. ${this.url} Id: ${this.connectionId}`);
    });

    this.wsClientIo.onClose(this.connectionId, () => {
      this.logInfo(`WebSocketClient: connection closed. ${this.url} Id: ${this.connectionId}`);

      if (!this.autoReconnect)  return;

      this.logInfo(`WebSocketClient: Reconnecting...`);
      this.wsClientIo.reConnect(this.connectionId);
    });

    this.wsClientIo.onError(this.connectionId, (err: string) => {
      return this.logError(err);
    });
  }

}
