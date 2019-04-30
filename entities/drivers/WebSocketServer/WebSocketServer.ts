import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import WsServerLogic, {WsServerLogicProps} from './WsServerLogic';
import WebSocketServerIo, {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';


type OnMessageHandler = (message: Uint8Array | {[index: string]: any}) => void;


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

  // TODO: use server listen promise

  /**
   * Force closing a connection
   */
  close(connectionId: string, code: number, reason: string) {
    if (!this._server) {
      throw new Error(`WebSocketServer.close: Server has been already closed`);
    }

    this._server.close(connectionId, code, reason);
  }

  send(connectionId: string, data: string | Uint8Array) {
    if (!this._server) {
      throw new Error(`WebSocketServer.send: Server has been already closed`);
    }

    this._server.send(connectionId, data);
  }

  onMessage(connectionId: string, cb: OnMessageHandler): number {
    if (!this._server) {
      throw new Error(`WebSocketServer.onMessage: Server has been already closed`);
    }

    return this._server.onMessage(connectionId, cb);
  }

  onConnection(cb: (connectionId: string, connectionParams: ConnectionParams) => void): number {
    if (!this._server) {
      throw new Error(`WebSocketServer.onNewConnection: Server has already been closed`);
    }

    return this._server.onConnection(cb);
  }

  removeMessageListener(connectionId: string, handlerId: number) {
    if (!this._server) {
      throw new Error(`WebSocketServer.onNewConnection: Server has been already closed`);
    }

    // TODO: review
    //this._server.removeEventListener(connectionId,'message', handlerId);
  }

  // TODO: remove on connection listener

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
