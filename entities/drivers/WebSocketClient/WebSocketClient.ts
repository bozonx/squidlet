import WebSocketClientIo, {OnMessageHandler} from 'system/interfaces/io/WebSocketClientIo';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import WsClientLogic, {WsClientLogicProps} from './WsClientLogic';


export interface WebSocketClientDriverProps {
  // host: string;
  // port: number;
  url: string;
  autoReconnect: boolean;
  reconnectTimeoutMs: number;
}


/**
 * Simplified websocket driver.
 * If autoReconnect if set it holds connection for ever and reconnects if it lost.
 * By calling getInstance() you will get always a new one. There isn't any sessions.
 */
export class WebSocketClient extends DriverBase<WebSocketClientDriverProps> {
  get openPromise(): Promise<void> {
    if (!this._client) {
      throw new Error(`WebSocketClient.openPromise: Connection hasn't been initialized or closed for ever`);
    }

    return this._client.openPromise;
  }

  private get wsClientIo(): WebSocketClientIo {
    return this.env.getIo('WebSocketClient') as any;
  }
  private _client?: WsClientLogic;


  protected willInit = async () => {
    const wsClientLogicProps: WsClientLogicProps = {
      ...this.props,
      // TODO: move to props and set -1 by default
      // infinity tries of reconnection
      maxTries: -1,
    };

    this._client = new WsClientLogic(
      this.wsClientIo,
      wsClientLogicProps,
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
    if (!this._client) throw new Error(`WebSocketClient.send: You can't send message because connection was closed for ever`);

    return this._client.send(data);
  }

  onMessage(cb: OnMessageHandler): number {
    if (!this._client) throw new Error(`WebSocketClient.onMessage: You can't listen connection because it was closed for ever`);

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
    this.env.log.error(`WebSocketClient: connection "${this.props.url}" has been closed, you can't manipulate it any more!`);

    // TODO: destroy logic ???
  }

}

export default class Factory extends DriverFactoryBase<WebSocketClient> {
  protected DriverClass = WebSocketClient;

  protected instanceAlwaysNew: boolean = false;

  // protected instanceIdCalc = (props: {[index: string]: any}): string => {
  //   return `${props.url}`;
  // }
}
