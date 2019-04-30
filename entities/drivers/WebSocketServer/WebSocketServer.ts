import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import WsServerLogic, {WsServerLogicProps} from './WsServerLogic';
import WebSocketServerIo, {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';


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
      this.onServerClosed,
      this.env.log.info,
      this.env.log.error
    );

    //this.connectionId = this.wsClientIo.newConnection({ url });

    //this.listen();
  }

  destroy = async () => {
    if (!this._server) return ;

    this._server.destroy();
  }


  /**
   * Force closing a connection
   */
  close(connectionId: string, code: number, reason: string) {
    this._server.close(this.serverId, connectionId, code, reason);
  }

  onMessage(connectionId: string, cb: IncomeDataHandler): number {
    return this._server.onMessage(this.serverId, connectionId, cb);
  }

  onNewConnection(cb: (connectionId: string, connectionParams: ConnectionParams) => void): number {
    return this._server.onConnection(this.serverId, cb);
  }

  removeMessageListener(connectionId: string, handlerId: number) {
    // TODO: review
    this._server.removeEventListener(this.serverId, connectionId,'message', handlerId);
  }


  // private listen() {
  // }

  private onServerClosed = () => {
    this.env.log.error(`WebSocketServer: Server "${this.props.host}:${this.props.port}" has been closed, you can't manipulate it any more!`);
  }

}

export default class Factory extends DriverFactoryBase<WebSocketServer> {
  protected DriverClass = WebSocketServer;

  // TODO: review

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return String(props.url);
  }
}
