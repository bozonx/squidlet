import WebSocketClientIo, {WebSocketClientProps} from 'system/interfaces/io/WebSocketClientIo';


export type IncomeDataHandler = (data: string | Uint8Array) => void;


/**
 * Websocket client simplified interface.
 * It makes only one connection to one host.
 * It can automatically reconnect if "autoReconnect" param is true.
 */
export default class WsClientLogic {
  // on first time connect or reconnect
  openPromise: Promise<void>;
  private readonly props: WebSocketClientProps;
  private readonly connectionId: string;
  private readonly wsClientIo: WebSocketClientIo;
  private readonly autoReconnect: boolean;
  private readonly onClose: () => void;
  private readonly logInfo: (message: string) => void;
  private readonly logError: (message: string) => void;
  private openPromiseResolve: () => void = () => {};
  private openPromiseReject: () => void = () => {};
  // was previous open promise fulfilled
  private wasPrevOpenFulfilled: boolean = false;


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
    this.openPromise = this.makeOpenPromise();
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
      this.wasPrevOpenFulfilled = true;
      this.openPromiseResolve();
      
      return this.logInfo(`WebSocketClient: connection opened. ${this.props.url} Id: ${this.connectionId}`);
    });

    this.wsClientIo.onError(this.connectionId, (err: string) => {
      return this.logError(err);
    });

    this.wsClientIo.onClose(this.connectionId, () => {
      this.logInfo(`WebSocketClient: connection closed. ${this.props.url} Id: ${this.connectionId}`);

      if (!this.autoReconnect) {
        this.wsClientIo.destroyConnection(this.connectionId);

        if (!this.wasPrevOpenFulfilled) {
          this.wasPrevOpenFulfilled = true;
          this.openPromiseReject();
        }
        
        return this.onClose();
      }

      // TODO: переконекчиваться регулярно каждые 10 секунд

      // make new promise if previous was fulfilled
      if (this.wasPrevOpenFulfilled) {
        this.openPromise = this.makeOpenPromise();
      }
      
      this.logInfo(`WebSocketClient: Reconnecting...`);
      
      this.wsClientIo.reConnect(this.connectionId);
    });
  }

  private makeOpenPromise(): Promise<void> {
    this.wasPrevOpenFulfilled = false;
    
    return new Promise<void>((resolve, reject) => {
      this.openPromiseResolve = resolve;
      this.openPromiseReject = reject;
    });
  }
  
}
