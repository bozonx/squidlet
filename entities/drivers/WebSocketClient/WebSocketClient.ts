import WebSocketClientIo from 'system/interfaces/io/WebSocketClientIo';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import WsClientLogic, {IncomeDataHandler, WsClientLogicProps} from './WsClientLogic';


export interface WebSocketClientDriverProps {
  host: string;
  port: number;
  autoReconnect: boolean;
  reconnectTimeoutSec: number;
}


/**
 * Simplified websocket driver.
 * It holds connection for ever and reconnects if it lost.
 */
export class WebSocketClient extends DriverBase<WebSocketClientDriverProps> {
  private get wsClientIo(): WebSocketClientIo {
    return this.env.getIo('WebSocketClient') as any;
  }
  private _client?: WsClientLogic;


  protected willInit = async () => {
    const wsClientLogicProps: WsClientLogicProps = {
      ...this.props,
      maxTries: 0,
      clientId: this.env.system.host.id,
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
  }


  async send(data: string | Uint8Array): Promise<void> {
    if (!this._client) throw new Error(`WebSocketClient.send: You can't send message because connection was closed for ever`);

    return this._client.send(data);
  }

  onMessage(cb: IncomeDataHandler): number {
    if (!this._client) throw new Error(`WebSocketClient.onMessage: You can't listen connection because it was closed for ever`);

    return this._client.onMessage(cb);
  }

  removeMessageListener(handlerId: number) {
    if (!this._client) return;

    this._client.removeMessageListener(handlerId);
  }


  private onConnectionClosed = () => {
    this.env.log.error(`WebSocketClient: connection "${this.props.host}:${this.props.port}" is closed, you can't manipulate it any more!`);
  }

}

export default class Factory extends DriverFactoryBase<WebSocketClient> {
  protected DriverClass = WebSocketClient;

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.host}:${props.port}`;
  }
}
