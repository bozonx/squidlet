import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import {HttpServerIo, HttpServerProps} from 'system/interfaces/io/HttpServerIo';
import {HttpServer} from '../HttpServer/HttpServer';


export class HttpServerRouter extends DriverBase<HttpServerProps> {
  // it fulfils when server is start listening
  get listeningPromise(): Promise<void> {
    if (!this.server) {
      throw new Error(`WebSocketServer.listeningPromise: ${this.closedMsg}`);
    }

    return this.server.listeningPromise;
  }

  private get wsServerIo(): HttpServerIo {
    return this.getIo('WebSocketServer') as any;
  }
  private server?: HttpServer;
  private get closedMsg() {
    return `Server "${this.props.host}:${this.props.port}" has been closed`;
  }


  protected willInit = async () => {
    this.server = new HttpServerLogic(
      this.wsServerIo,
      this.props,
      this.onServerClosed,
      this.log.info,
      this.log.error
    );
  }

  protected appDidInit = async () => {
    this.server && await this.server.init();
  }

  destroy = async () => {
    if (!this.server) return;

    await this.server.destroy();
    delete this.server;
  }


  // send(connectionId: string, data: string | Uint8Array): Promise<void> {
  //   if (!this.server) throw new Error(`WebSocketServer.send: ${this.closedMsg}`);
  //
  //   return this.server.send(connectionId, data);
  // }

  /**
   * Force closing a connection
   */
  async closeConnection(connectionId: string, code: number, reason: string): Promise<void> {
    if (!this.server) return;

    await this.server.closeConnection(connectionId, code, reason);
  }

  // async setCookie(connectionId: string, cookie: string) {
  //   if (!this.server) return;
  //
  //   await this.server.setCookie(connectionId, cookie);
  // }

  onRequest(cb: (request: HttpDriverRequest) => Promise<HttpDriverResponse>): number {
    // TODO: remove
    // TODO: remove listener
    return this.server.onRequest(cb);
  }

/

  onConnection(
    cb: (connectionId: string, connectionParams: ConnectionParams) => void
  ): number {
    if (!this.server) throw new Error(`WebSocketServer.onConnection: ${this.closedMsg}`);

    return this.server.onConnection(cb);
  }

  onConnectionClose(cb: (connectionId: string) => void): number {
    if (!this.server) throw new Error(`WebSocketServer.onConnectionClose: ${this.closedMsg}`);

    return this.server.onConnectionClose(cb);
  }

  removeListener(eventName: WS_SERVER_EVENTS, handlerIndex: number) {
    if (!this.server) return;

    this.server.removeListener(eventName, handlerIndex);
  }


  private onServerClosed = () => {
    this.log.error(`WebSocketServer: ${this.closedMsg}, you can't manipulate it any more!`);
  }

}

export default class Factory extends DriverFactoryBase<HttpServer> {
  protected DriverClass = HttpServer;

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.host}:${props.port}`;
  }
}
