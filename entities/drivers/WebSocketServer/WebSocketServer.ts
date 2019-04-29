import WebSocketClientIo from 'system/interfaces/io/WebSocketClientIo';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';


type IncomeDataHandler = (message: {[index: string]: any}) => void;


export interface WebSocketServerDriverProps {
  host: string;
  port: number;
}


export class WebSocketServerConnection {
  private readonly clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  send(message: {[index: string]: any}) {

  }

  onIncomeMessage(cb: IncomeDataHandler) {

  }

  destroy = async () => {
    // TODO: close connections and remove listeners
  }

}


export class WebSocketServer extends DriverBase<WebSocketServerDriverProps> {
  private get wsServerIo(): WebSocketClientIo {
    return this.env.getIo('WebSocketServer') as any;
  }


  protected willInit = async () => {
    //this.connectionId = this.wsClientIo.newConnection({ url });

    this.listen();
  }

  destroy = async () => {
    // TODO: close connections and remove listeners
  }


  onConnection(cb: () => WebSocketServerConnection) {

  }


  private listen() {
    // TODO: make reconnection if connection lost
  }

}

export default class Factory extends DriverFactoryBase<WebSocketServer> {
  protected DriverClass = WebSocketServer;

  // TODO: review

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return String(props.url);
  }
}
