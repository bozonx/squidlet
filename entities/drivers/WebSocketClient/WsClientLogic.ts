import {omit} from 'system/helpers/lodashLike';
import WebSocketClientIo from 'system/interfaces/io/WebSocketClientIo';


export type IncomeDataHandler = (data: string | Uint8Array) => void;


export default class WsClientLogic {
  private readonly connectionId: number;
  private readonly wsClientIo: WebSocketClientIo;
  private readonly autoReconnect: boolean;


  constructor(
    wsClientIo: WebSocketClientIo,
    host: string,
    port: number,
    clientId: string,
    autoReconnect: boolean
  ) {
    this.wsClientIo = wsClientIo;
    this.autoReconnect = autoReconnect;

    const url = `ws://${host}:${port}?clientId=${clientId}`;

    this.connectionId = this.wsClientIo.newConnection({
      url,
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
      return this.env.log.info(`WebSocketClient: connection opened. Id: ${this.connectionId}`);
    });

    this.wsClientIo.onClose(this.connectionId, () => {
      this.env.log.info(`WebSocketClient: connection closed. Id: ${this.connectionId}. Reconnecting...`);

      this.wsClientIo.reConnect(this.connectionId);
    });

    this.wsClientIo.onError(this.connectionId, (err: string) => {
      return this.env.log.error(err);
    });
  }

}
