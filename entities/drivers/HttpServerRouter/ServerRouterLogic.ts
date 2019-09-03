import {HttpDriverRequest, HttpDriverResponse} from '../HttpServer/HttpServerLogic';
import {HttpRequest} from '../../../system/interfaces/io/HttpServerIo';
import {JsonTypes} from '../../../system/interfaces/Types';
import IndexedEventEmitter from '../../../system/lib/IndexedEventEmitter';


interface ParsedRoute {
  // parsed url parts like /path/to/:page => ['path', 'to', 'myPageName'];
  path: string[];
  // route which has been set in addRoute()
  route: string;
  routeParams: {[index: string]: JsonTypes};
  // parameters
  search: {[index: string]: JsonTypes};
}

interface RouteItem {
  route: string;
  routeParams: {[index: string]: JsonTypes};
}

type RouterRequestHandler = (parsedRoute: ParsedRoute, request: HttpDriverRequest) => Promise<HttpDriverResponse>;


export default class ServerRouterLogic {
  private readonly events = new IndexedEventEmitter<RouterRequestHandler>();
  private readonly registeredRoutes: RouteItem[] = [];


  constructor() {
  }


  /**
   * Call this to register a new route and its params
   */
  addRoute(route: string, routeParams: {[index: string]: JsonTypes}) {
    this.registeredRoutes.push({ route, routeParams });
  }

  /**
   * Call this only when a new request came.
   */
  parseIncomeRequest(request: HttpRequest) {
    const driverRequest: HttpDriverRequest = this.makeDriverRequest(request);
  }

  /**
   * Call this to handle calling of route
   */
  onRequest(route: string, cb: RouterRequestHandler): number {

    // TODO: слушать ещё и method

    // const handlerWrapper = (parsedRoute: ParsedRoute, request: HttpDriverRequest): Promise<HttpDriverResponse> => {
    //   if (parsedRoute.route !== route) return;
    //
    //   // TODO: cb returns a response !!!!
    //
    //   cb(parsedRoute, request);
    // }

    // TODO: cb returns a response !!!! этом может не обрабатываться в events

    return this.events.addListener(route, cb);
  }

  removeRequestListener(route: string, handlerIndex: number) {
    this.events.removeListener(route, handlerIndex);
  }


  private makeDriverRequest(request: HttpRequest): HttpDriverRequest {
    return {
      ...request,
      // TODO: prepare body - resolve type
    };
  }

}
