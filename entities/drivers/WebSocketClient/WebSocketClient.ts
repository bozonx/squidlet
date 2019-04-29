import WebSocketClientIo from 'system/interfaces/io/WebSocketClientIo';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import {omit} from '../../../system/helpers/lodashLike';


type IncomeDataHandler = (data: string | Uint8Array) => void;


export interface WebSocketClientDriverProps {
  host: string;
  port: number;
}

export class WebSocketClient extends DriverBase<WebSocketClientDriverProps> {
  private get wsClientIo(): WebSocketClientIo {
    return this.env.getIo('WebSocketClient') as any;
  }
  private connectionId: number = -1;


  protected willInit = async () => {
    const url = `ws://${this.props.host}:${this.props.port}?hostid=${this.env.system.host.id}`;

    this.connectionId = this.wsClientIo.newConnection({
      url,
      // additional io client params
      ...omit(this.props, 'host', 'port')
    });

    this.listen();
  }

  destroy = async () => {
    //this.wsClientIo.close(this.connectionId, 0, 'Closing on destroy');

    // TODO: remove listeners
  }


  async send(data: string | Uint8Array): Promise<void> {
    return this.wsClientIo.send(this.connectionId, data);
  }

  onMessage(cb: IncomeDataHandler) {
    return this.wsClientIo.onMessage(this.connectionId, cb);
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

export default class Factory extends DriverFactoryBase<WebSocketClient> {
  protected DriverClass = WebSocketClient;

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return String(props.url);
  }

  // TODO: use io's destroy
}
