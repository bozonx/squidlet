import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import WsServerLogic, {WsServerLogicProps} from './WsServerLogic';
import WebSocketServerIo, {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';
import {OnMessageHandler} from 'system/interfaces/io/WebSocketClientIo';


export interface WebSocketServerDriverProps {
  host: string;
  port: number;
  //binary?: boolean;
}


export class WebSocketServer extends DriverBase<WebSocketServerDriverProps> {
  get listeningPromise(): Promise<void> {
    if (!this._server) {
      throw new Error(`WebSocketServer.listeningPromise: Server has been already closed`);
    }

    return this._server.listeningPromise;
  }

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

    // TODO: use clientId instead of connectionId

    /*
    import * as querystring from 'querystring';

    const splitUrl: string[] = (request.url as any).split('?');
    const getParams: {clientId: string} = querystring.parse(splitUrl[1]) as any;
    const clientId: string = getParams.clientId;

     */
  }

  destroy = async () => {
    if (!this._server) return;

    await this._server.destroy();
  }


  /**
   * Force closing a connection
   */
  close(connectionId: string, code: number, reason: string) {
    if (!this._server) {
      throw new Error(`WebSocketServer.close: Server has been already closed`);
    }

    this._server.close(connectionId, code, reason);
  }

  send(connectionId: string, data: string | Uint8Array): Promise<void> {
    if (!this._server) {
      throw new Error(`WebSocketServer.send: Server has been already closed`);
    }

    return this._server.send(connectionId, data);
  }

  onMessage(connectionId: string, cb: OnMessageHandler): number {
    if (!this._server) {
      throw new Error(`WebSocketServer.onMessage: Server has been already closed`);
    }

    return this._server.onMessage(connectionId, cb);
  }

  onConnection(cb: (connectionId: string, connectionParams: ConnectionParams) => void): number {
    if (!this._server) {
      throw new Error(`WebSocketServer.onConnection: Server has already been closed`);
    }

    return this._server.onConnection(cb);
  }

  removeMessageListener(connectionId: string, handlerId: number) {
    if (!this._server) {
      throw new Error(`WebSocketServer.removeMessageListener: Server has been already closed`);
    }

    this._server.removeMessageListener(connectionId, handlerId);
  }

  removeConnectionListener(handlerId: number) {
    if (!this._server) {
      throw new Error(`WebSocketServer.removeConnectionListener: Server has been already closed`);
    }

    this._server.removeConnectionListener(handlerId);
  }

  private onServerClosed = () => {
    this.env.log.error(`WebSocketServer: Server "${this.props.host}:${this.props.port}" has been closed, you can't manipulate it any more!`);
  }

}

export default class Factory extends DriverFactoryBase<WebSocketServer> {
  protected DriverClass = WebSocketServer;

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.host}:${props.port}`;
  }
}
