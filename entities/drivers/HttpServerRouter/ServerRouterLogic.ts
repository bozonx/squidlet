import {HttpDriverRequest, HttpDriverResponse} from '../HttpServer/HttpServerLogic';
import {HttpRequest} from '../../../system/interfaces/io/HttpServerIo';
import {JsonTypes} from '../../../system/interfaces/Types';


interface ParsedRoute {
  // parsed url parts like /path/to/:page => ['path', 'to', 'myPageName'];
  route: string[];
  routeParams: {[index: string]: JsonTypes};
  // parameters
  search: {[index: string]: JsonTypes};
}

interface RouteItem {
  route: string;
  routeParams: {[index: string]: JsonTypes};
};

type RouterRequestHandler = (route: ParsedRoute, request: HttpDriverRequest) => Promise<HttpDriverResponse>;


export default class ServerRouterLogic {
  private readonly registeredRoutes: RouteItem[] = [];


  constructor() {

  }


  addRoute(route: string, routeParams: {[index: string]: JsonTypes}) {
    this.registeredRoutes.push({ route, routeParams });
  }

  parseIncomeRequest(request: HttpRequest) {
    // TODO: add
  }

  onRequest(route: string, cb: RouterRequestHandler): number {
    // TODO: может свой request
    // TODO: add
  }

  removeRequestListener(handlerIndex: number) {
    // TODO: add
  }

}
