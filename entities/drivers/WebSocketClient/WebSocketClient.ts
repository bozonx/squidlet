import WebSocketClientIo from 'system/interfaces/io/WebSocketClientIo';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';


type IncomeDataHandler = (message: {[index: string]: any}) => void;


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

    this.connectionId = this.wsClientIo.newConnection({ url });

    this.listen();
  }

  destroy = async () => {
    // TODO: close connection and remove listeners
  }


  async send(message: {[index: string]: any}): Promise<void> {

  }

  onIncomeMessage(cb: IncomeDataHandler) {

  }


  private listen() {
    // TODO: make reconnection if connection lost
  }

}

export default class Factory extends DriverFactoryBase<WebSocketClient> {
  protected DriverClass = WebSocketClient;

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return String(props.url);
  }
}
