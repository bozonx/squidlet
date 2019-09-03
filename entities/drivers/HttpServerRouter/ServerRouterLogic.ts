
// TODO: make absolute paths

import {HttpMethods, HttpRequest} from '../../../system/interfaces/io/HttpServerIo';
import {JsonTypes} from '../../../system/interfaces/Types';
import IndexedEventEmitter from '../../../system/lib/IndexedEventEmitter';
import {trimChar} from '../../../system/lib/strings';
import {ParsedUrl, parseUrl} from '../../../system/lib/url';
import {HttpDriverRequest, HttpDriverResponse} from '../HttpServer/HttpServerLogic';


const EVENT_NAME_DELIMITER = '|';


interface ParsedRoute {
  // parsed url params like /path/to/:page => {page: 'myPageName'};
  params: {[index: string]: string | number};
  // route which has been set in addRoute()
  route: string;
  routeParams: {[index: string]: JsonTypes};
  location: ParsedUrl;
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

    // TODO: поднять на все роуты с /page/:id

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
    const location: ParsedUrl = parseUrl(request.url);
    const { route, params } = this.resolveRoute(location.url);
    const eventName = `${request.method}${EVENT_NAME_DELIMITER}${route}`;
    const routeItem: RouteItem = this.registeredRoutes[eventName];

    return {
      route,
      params,
      routeParams: routeItem.routeParams,
      location,
    };
  }

  private resolveRoute(relativeUrl: string): { route: string, params: {[index: string]: string | number} } {
    // TODO: это ещё не роут - это только url - нужно соотнести с шаблонами routes и поднять все совпадающие

    // TODO: resolve - parse params like :id
    // TODO: resolve numbers
  }

  private prepareRoute(rawRoute: string): string {
    return trimChar(rawRoute, '/');
  }

}
