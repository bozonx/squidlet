import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import WsServerLogic, {WsServerLogicProps} from './WsServerLogic';
import WebSocketServerIo from 'system/interfaces/io/WebSocketServerIo';


type IncomeDataHandler = (message: Uint8Array | {[index: string]: any}) => void;


export interface WebSocketServerDriverProps {
  host: string;
  port: number;
  //binary?: boolean;
}


// TODO: удостовериться что при переподключении клиента будет тот же clientId

export class WebSocketServer extends DriverBase<WebSocketServerDriverProps> {
  private get wsServerIo(): WebSocketServerIo {
    return this.env.getIo('WebSocketServer') as any;
  }
  private _server?: WsServerLogic;


  protected willInit = async () => {
    const wsServerLogicProps: WsServerLogicProps = {
      ...this.props,
    };

    this._server = new WsServerLogic(
      this.wsServerIo,
      wsServerLogicProps,
      this.env.log.info,
      this.env.log.error
    );

    //this.connectionId = this.wsClientIo.newConnection({ url });

    //this.listen();
  }

  destroy = async () => {
    // TODO: close connections and remove listeners
  }


  onConnection(cb: (clientId: string) => void) {
    // TODO: !!!
  }

  send(clientId: string, message: {[index: string]: any}) {
    // TODO: !!!
  }

  onIncomeMessage(clientId: string, cb: IncomeDataHandler) {
    // TODO: !!!
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
