import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import WsServerLogic, {WsServerLogicProps} from './WsServerLogic';
import WebSocketServerIo, {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';
import {OnMessageHandler} from 'system/interfaces/io/WebSocketClientIo';


export class WsServer extends DriverBase<WsServerLogicProps> {
  // it fulfils when server is start listening
  get listeningPromise(): Promise<void> {
    if (!this.server) {
      throw new Error(`WebSocketServer.listeningPromise: Server has been already closed`);
    }

    return this.server.listeningPromise;
  }

  private get wsServerIo(): WebSocketServerIo {
    return this.env.getIo('WebSocketServer') as any;
  }
  private server?: WsServerLogic;
  get serverClosedMsg() {
    return `Server "${this.props.host}:${this.props.port}" has been closed`;
  }


  protected willInit = async () => {
    this.server = new WsServerLogic(
      this.wsServerIo,
      this.props,
      this.onServerClosed,
      this.env.log.info,
      this.env.log.error
    );
  }

  destroy = async () => {
    if (!this.server) return;

    await this.server.destroy();
  }


  async closeServer(): Promise<void> {
    if (!this.server) return;

    return this.server.closeServer();
  }

  /**
   * Force closing a connection
   */
  close(connectionId: string, code: number, reason: string) {
    if (!this.server) return;

    this.server.close(connectionId, code, reason);
  }

  send(connectionId: string, data: string | Uint8Array): Promise<void> {
    if (!this.server) throw new Error(`WebSocketServer.send: ${this.serverClosedMsg}`);

    return this.server.send(connectionId, data);
  }

  onMessage(connectionId: string, cb: OnMessageHandler): number {
    if (!this.server) throw new Error(`WebSocketServer.onMessage: ${this.serverClosedMsg}`);

    return this.server.onMessage(connectionId, cb);
  }

  onConnection(cb: (connectionId: string, connectionParams: ConnectionParams) => void): number {
    if (!this.server) throw new Error(`WebSocketServer.onConnection: ${this.serverClosedMsg}`);

    return this.server.onConnection(cb);
  }

  onConnectionClose(cb: (connectionId: string) => void): number {
    if (!this.server) throw new Error(`WebSocketServer.onConnectionClose: ${this.serverClosedMsg}`);

    return this.server.onConnectionClose(cb);
  }

  removeMessageListener(connectionId: string, handlerId: number) {
    if (!this.server) throw new Error(`WebSocketServer.removeMessageListener: ${this.serverClosedMsg}`);

    this.server.removeMessageListener(connectionId, handlerId);
  }

  removeConnectionListener(handlerId: number) {
    if (!this.server) throw new Error(`WebSocketServer.removeConnectionListener: ${this.serverClosedMsg}`);

    this.server.removeConnectionListener(handlerId);
  }

  private onServerClosed = () => {
    this.env.log.error(`WebSocketServer: ${this.serverClosedMsg}, you can't manipulate it any more!`);
  }

}

export default class Factory extends DriverFactoryBase<WsServer> {
  protected DriverClass = WsServer;

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.host}:${props.port}`;
  }
}


/*
import * as querystring from 'querystring';

const splitUrl: string[] = (request.url as any).split('?');
const getParams: {clientId: string} = querystring.parse(splitUrl[1]) as any;
const clientId: string = getParams.clientId;
 */
