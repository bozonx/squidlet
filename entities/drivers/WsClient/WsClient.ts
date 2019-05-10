import WebSocketClientIo, {OnMessageHandler} from 'system/interfaces/io/WebSocketClientIo';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import WsClientLogic, {WsClientLogicProps} from './WsClientLogic';


/**
 * Simplified websocket driver.
 * If autoReconnect if set it holds connection for ever and reconnects if it lost.
 * By calling getInstance() you will get always a new one. There isn't any sessions.
 */
export class WsClient extends DriverBase<WsClientLogicProps> {
  get openPromise(): Promise<void> {
    if (!this._client) {
      throw new Error(`WebSocketClient.openPromise: ${this.closedMsg}`);
    }

    return this._client.openPromise;
  }

  private get wsClientIo(): WebSocketClientIo {
    return this.env.getIo('WebSocketClient') as any;
  }
  private _client?: WsClientLogic;
  private get closedMsg() {
    return `You can't send message because connection "${this.props.url}" has been closed`;
  }


  protected willInit = async () => {
    this._client = new WsClientLogic(
      this.wsClientIo,
      this.props,
      this.onConnectionClosed,
      this.env.log.info,
      this.env.log.error
    );
  }

  destroy = async () => {
    if (!this._client) return;

    this._client.destroy();
    delete this._client;
  }


  send(data: string | Uint8Array): Promise<void> {
    if (!this._client) throw new Error(`WebSocketClient.send: ${this.closedMsg}`);

    return this._client.send(data);
  }

  onMessage(cb: OnMessageHandler): number {
    if (!this._client) throw new Error(`WebSocketClient.onMessage: ${this.closedMsg}`);

    return this._client.onMessage(cb);
  }

  removeMessageListener(handlerId: number) {
    if (!this._client) return;

    this._client.removeMessageListener(handlerId);
  }


  /**
   * It calls on unexpected closing of connection or on max reconnect tries is exceeded.
   */
  private onConnectionClosed = () => {
    // TODO: ??? why print message
    this.env.log.error(`WebSocketClient: connection "${this.props.url}" has been closed, you can't manipulate it any more!`);

    // TODO: destroy logic ???
  }

}

export default class Factory extends DriverFactoryBase<WsClient> {
  protected DriverClass = WsClient;

  protected instanceAlwaysNew: boolean = false;
}
