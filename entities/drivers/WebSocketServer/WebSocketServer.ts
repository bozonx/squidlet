import WebSocketClientIo from 'system/interfaces/io/WebSocketClientIo';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import WsServerLogic, {WsServerLogicProps} from './WsServerLogic';


type IncomeDataHandler = (message: Uint8Array | {[index: string]: any}) => void;


export interface WebSocketServerDriverProps {
  host: string;
  port: number;
  binary?: boolean;
}


// TODO: не нужно
// export class WebSocketServerConnection {
//   readonly clientId: string;
//
//   constructor(clientId: string) {
//     this.clientId = clientId;
//   }
//
//   send(message: {[index: string]: any}) {
//
//   }
//
//   onIncomeMessage(cb: IncomeDataHandler) {
//
//   }
//
//   destroy = async () => {
//     // TODO: close connections and remove listeners
//   }
//
// }


// TODO: удостовериться что при переподключении клиента будет тот же clientId

export class WebSocketServer extends DriverBase<WebSocketServerDriverProps> {
  private get wsServerIo(): WebSocketClientIo {
    return this.env.getIo('WebSocketServer') as any;
  }
  private _server?: WsServerLogic;


  protected willInit = async () => {
    const wsServerLogicProps: WsServerLogicProps = {

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
