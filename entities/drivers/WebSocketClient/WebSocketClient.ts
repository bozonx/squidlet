import WebSocketClientIo from 'system/interfaces/io/WebSocketClientIo';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import WsClientLogic, {IncomeDataHandler} from './WsClientLogic';


export interface WebSocketClientDriverProps {
  host: string;
  port: number;
  autoReconnect: boolean;
}

export class WebSocketClient extends DriverBase<WebSocketClientDriverProps> {
  private get wsClientIo(): WebSocketClientIo {
    return this.env.getIo('WebSocketClient') as any;
  }
  private _client?: WsClientLogic;
  private get client(): WsClientLogic {
    return this._client as any;
  }


  protected willInit = async () => {
    this._client = new WsClientLogic(
      this.wsClientIo,
      this.props.host,
      this.props.port,
      this.env.system.host.id,
      this.props.autoReconnect,
      this.env.log.info,
      this.env.log.error
    );
  }

  destroy = async () => {
    this.client.destroy();
  }


  async send(data: string | Uint8Array): Promise<void> {
    return this.client.send(data);
  }

  onMessage(cb: IncomeDataHandler): number {
    return this.client.onMessage(cb);
  }

  removeMessageListener(handlerId: number) {
    this.client.removeMessageListener(handlerId);
  }

}

export default class Factory extends DriverFactoryBase<WebSocketClient> {
  protected DriverClass = WebSocketClient;

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.host}:${props.port}`;
  }

  // TODO: use io's destroy
}
