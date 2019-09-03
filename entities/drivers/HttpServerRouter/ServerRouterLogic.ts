import {HttpDriverRequest, HttpDriverResponse} from '../HttpServer/HttpServerLogic';
import {HttpMethods, HttpRequest} from '../../../system/interfaces/io/HttpServerIo';
import {JsonTypes} from '../../../system/interfaces/Types';
import IndexedEventEmitter from '../../../system/lib/IndexedEventEmitter';
import {trimChar} from '../../../system/lib/strings';


const EVENT_NAME_DELIMITER = '|';


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
  // full route
  route: string;
  method: HttpMethods;
  routeParams: {[index: string]: JsonTypes};
}

type RouterRequestHandler = (parsedRoute: ParsedRoute, request: HttpDriverRequest) => Promise<HttpDriverResponse>;


export default class ServerRouterLogic {
  private readonly events = new IndexedEventEmitter<RouterRequestHandler>();
  private readonly registeredRoutes: {[index: string]: RouteItem} = {};
  private readonly logDebug: (msg: string) => void;


  constructor(logDebug: (msg: string) => void) {
    this.logDebug = logDebug;
  }


  /**
   * Call this to register a new route and its params
   */
  addRoute(method: HttpMethods, route: string, routeParams: {[index: string]: JsonTypes}) {
    const preparedRoute: string = this.prepareRoute(route);
    const eventName = `${method.toLowerCase()}${EVENT_NAME_DELIMITER}${preparedRoute}`;

    this.registeredRoutes[eventName] = { method, route: preparedRoute, routeParams };
  }

  /**
   * Call this only when a new request came.
   */
  parseIncomeRequest(request: HttpRequest) {
    const driverRequest: HttpDriverRequest = this.makeDriverRequest(request);
    const parsedRoute: ParsedRoute = this.parseRoute(request);
    const eventName = `${driverRequest.method}${EVENT_NAME_DELIMITER}${parsedRoute.route}`;
    const resolvedRoute: RouteItem | undefined = this.registeredRoutes[eventName];

    if (!resolvedRoute) {
      this.logDebug(`ServerRouterLogic.parseIncomeRequest: route "${eventName}: isn't registered!`);

      return;
    }

    this.events.emit(eventName, parsedRoute, driverRequest);
  }

  /**
   * Call this to handle calling of route
   */
  onRequest(method: HttpMethods, route: string, cb: RouterRequestHandler): number {
    const preparedRoute: string = this.prepareRoute(route);


    // const handlerWrapper = (parsedRoute: ParsedRoute, request: HttpDriverRequest): Promise<HttpDriverResponse> => {
    //   if (parsedRoute.route !== route) return;
    //
    //   // TODO: cb returns a response !!!!
    //
    //   cb(parsedRoute, request);
    // }


    // TODO: cb returns a response !!!! этом может не обрабатываться в events

    const eventName = `${method.toLowerCase()}${EVENT_NAME_DELIMITER}${preparedRoute}`;

    return this.events.addListener(eventName, cb);
  }

  removeRequestListener(method: HttpMethods, route: string, handlerIndex: number) {
    const preparedRoute: string = this.prepareRoute(route);
    const eventName = `${method.toLowerCase()}${EVENT_NAME_DELIMITER}${preparedRoute}`;

    this.events.removeListener(eventName, handlerIndex);
  }


  private makeDriverRequest(request: HttpRequest): HttpDriverRequest {
    return {
      ...request,
      // TODO: prepare body - resolve type
    };
  }

  private parseRoute(request: HttpRequest): ParsedRoute {
    // TODO: parse
    const localUrl: string = '';
    // TODO: parse url - see cookies
    const search: {[index: string]: JsonTypes} = {};
    const preparedRoute: string = this.prepareRoute(localUrl);
    const eventName = `${request.method}${EVENT_NAME_DELIMITER}${preparedRoute}`;
    const routeItem: RouteItem = this.registeredRoutes[eventName];
    const routePath: string[] = [];

    return {
      path: routePath,
      route: routeItem.route,
      routeParams: routeItem.routeParams,
      search,
    };
  }

  private prepareRoute(rawRoute: string): string {
    return trimChar(rawRoute, '/');
  }

}
