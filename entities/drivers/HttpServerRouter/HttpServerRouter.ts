import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import {HttpServerProps} from 'system/interfaces/io/HttpServerIo';
import HttpRouterLogic, {RouterRequestHandler} from '../../../system/lib/HttpRouterLogic';
import {HttpMethods} from 'system/interfaces/io/HttpServerIo';
import {JsonTypes} from 'system/interfaces/Types';
import {GetDriverDep} from 'system/base/EntityBase';
import {HttpServer} from '../HttpServer/HttpServer';
import {HttpDriverRequest, HttpDriverResponse} from '../HttpServer/HttpServerLogic';


export class HttpServerRouter extends DriverBase<HttpServerProps> {
  // it fulfils when server is start listening
  get listeningPromise(): Promise<void> {
    if (!this.server) {
      throw new Error(`HttpServerRouter.listeningPromise: ${this.closedMsg}`);
    }

    return this.server.listeningPromise;
  }

  private _router?: HttpRouterLogic;


  private get router(): HttpRouterLogic {
    return this._router as any;
  }
  private get server(): HttpServer {
    return this.depsInstances.server;
  }
  private get closedMsg() {
    return `Server "${this.props.host}:${this.props.port}" has been already closed`;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.server = await getDriverDep('HttpServer')
      .getInstance(this.props);
    this._router = new HttpRouterLogic(this.log.debug);

    this.server.onRequest(this.handleIncomeRequest);
  }

  destroy = async () => {
    this.router.destroy();
  }


  addRoute(method: HttpMethods, route: string, pinnedProps: {[index: string]: JsonTypes}) {
    this.router.addRoute(method, route, pinnedProps);
  }

  onRequest(method: HttpMethods, route: string, cb: RouterRequestHandler): number {
    return this.router.onRequest(method, route, cb);
  }

  async closeServer() {
    if (!this.server) throw new Error(`HttpServerRouter.removeRequestListener: ${this.onRequest}`);

    return this.server.closeServer();
  }


  private handleIncomeRequest(request: HttpDriverRequest): Promise<HttpDriverResponse> {
    this.router.parseIncomeRequest(request);

    // TODO: как получить ответ ????
    // TODO: если не найден обработчик - то вернуть 404
  }

}

export default class Factory extends DriverFactoryBase<HttpServerRouter> {
  protected DriverClass = HttpServerRouter;

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.host}:${props.port}`;
  }
}
