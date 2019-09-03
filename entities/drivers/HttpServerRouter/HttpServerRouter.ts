import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import {HttpServerIo, HttpServerProps} from 'system/interfaces/io/HttpServerIo';
import {HttpServer} from '../HttpServer/HttpServer';
import ServerRouterLogic, {RouterRequestHandler} from './ServerRouterLogic';
import {HttpMethods, HttpRequest} from '../../../system/interfaces/io/HttpServerIo';
import {JsonTypes} from '../../../system/interfaces/Types';


export class HttpServerRouter extends DriverBase<HttpServerProps> {
  // TODO: add
  // it fulfils when server is start listening
  // get listeningPromise(): Promise<void> {
  //   if (!this.server) {
  //     throw new Error(`WebSocketServer.listeningPromise: ${this.closedMsg}`);
  //   }
  //
  //   return this.server.listeningPromise;
  // }

  private _router?: ServerRouterLogic;


  private get router(): ServerRouterLogic {
    return this._router as any;
  }
  // private get closedMsg() {
  //   return `Server "${this.props.host}:${this.props.port}" has been closed`;
  // }


  protected willInit = async () => {
    this._router = new ServerRouterLogic(this.log.debug);
    // TODO: get instance of HttpDriver
  }

  // protected didInit = async () => {
  //   this.router.
  // }

  // protected appDidInit = async () => {
  //   await this.router.init();
  // }

  destroy = async () => {
    // TODO: вызвать destroy io http server
    // if (!this.server) return;
    //
    // await this.server.destroy();
    // delete this.server;
  }


  addRoute(method: HttpMethods, route: string, pinnedProps: {[index: string]: JsonTypes}) {
    this.router.addRoute(method, route, pinnedProps);
  }

  onRequest(method: HttpMethods, route: string, cb: RouterRequestHandler): number {
    return this.router.onRequest(method, route, cb);
  }

  async closeServer() {
    if (!this.serverId) return;

    // TODO: должно при этом подняться событие close или нет ???
    await this.httpServerIo.closeServer(this.serverId);

    delete this.serverId;
  }

  // onConnection(
  //   cb: (connectionId: string, connectionParams: ConnectionParams) => void
  // ): number {
  //   if (!this.server) throw new Error(`WebSocketServer.onConnection: ${this.closedMsg}`);
  //
  //   return this.server.onConnection(cb);
  // }
  //
  // onConnectionClose(cb: (connectionId: string) => void): number {
  //   if (!this.server) throw new Error(`WebSocketServer.onConnectionClose: ${this.closedMsg}`);
  //
  //   return this.server.onConnectionClose(cb);
  // }
  //
  // removeListener(eventName: WS_SERVER_EVENTS, handlerIndex: number) {
  //   if (!this.server) return;
  //
  //   this.server.removeListener(eventName, handlerIndex);
  // }
  //
  //
  // private onServerClosed = () => {
  //   this.log.error(`WebSocketServer: ${this.closedMsg}, you can't manipulate it any more!`);
  // }

}

export default class Factory extends DriverFactoryBase<HttpServerRouter> {
  protected DriverClass = HttpServerRouter;

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.host}:${props.port}`;
  }
}
