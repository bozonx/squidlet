import {JsonTypes} from '../interfaces/Types';
import IndexedEventEmitter from './IndexedEventEmitter';
import {trimChar} from './strings';
import {ParsedUrl, parseUrl, URL_DELIMITER} from './url';
// TODO: don't use dependencies
import {HttpMethods, HttpRequest} from '../interfaces/io/HttpServerIo';
// TODO: don't use dependencies
import {HttpDriverRequest, HttpDriverResponse} from '../../entities/drivers/HttpServer/HttpServerLogic';


const EVENT_NAME_DELIMITER = '|';


export interface Route {
  // parsed url params like /path/to/:page => {page: 'myPageName'};
  params: {[index: string]: string | number};
  // route which has been set in addRoute()
  route: string;
  pinnedProps: {[index: string]: JsonTypes};
  location: ParsedUrl;
}

export type RouterRequestHandler = (route: Route, request: HttpDriverRequest) => Promise<HttpDriverResponse>;

interface RouteItem {
  // full route
  route: string;
  method: HttpMethods;
  routeHandler: RouterRequestHandler;
  pinnedProps?: {[index: string]: JsonTypes};
}


export default class HttpRouterLogic {
  private readonly events = new IndexedEventEmitter<RouterRequestHandler>();
  private readonly registeredRoutes: {[index: string]: RouteItem} = {};
  private readonly logDebug: (msg: string) => void;


  constructor(logDebug: (msg: string) => void) {
    this.logDebug = logDebug;
  }

  destroy() {
    this.events.destroy();
  }


  /**
   * Call this to register a new route and its params
   */
  addRoute(
    method: HttpMethods,
    route: string,
    routeHandler: RouterRequestHandler,
    pinnedProps?: {[index: string]: JsonTypes}
  ) {
    const preparedRoute: string = this.prepareRoute(route);
    const preparedMethod = method.toLowerCase() as HttpMethods;
    const eventName = `${preparedMethod}${EVENT_NAME_DELIMITER}${preparedRoute}`;

    this.registeredRoutes[eventName] = {
      method: preparedMethod,
      route: preparedRoute,
      routeHandler,
      pinnedProps
    };
  }

  /**
   * Call this only when a new request came.
   */
  async incomeRequest(request: HttpDriverRequest): Promise<HttpDriverResponse> {

    // TODO: сначала найти item потом сделать RouteObj

    const parsedRoute: Route | undefined = this.makeRouteObj(request);

    if (!parsedRoute) {
      return {
        status: 404,
        body: `route for url "${request.url}: isn't registered!`
      };
    }

    const eventName = `${request.method}${EVENT_NAME_DELIMITER}${parsedRoute.route}`;
    const driverRequest: HttpDriverRequest = this.makeDriverRequest(request);

    // TODO: сразу вернуть ответ

    //this.events.emit(eventName, parsedRoute, driverRequest);
  }

  removeRequestListener(method: HttpMethods, route: string, handlerIndex: number) {
    const preparedRoute: string = this.prepareRoute(route);
    const eventName = `${method.toLowerCase()}${EVENT_NAME_DELIMITER}${preparedRoute}`;

    this.events.removeListener(eventName, handlerIndex);
  }


  private makeDriverRequest(request: HttpRequest): HttpDriverRequest {
    return {
      ...request,
      // TODO: может это будет в самом драйвере происходить ???
      // TODO: prepare body - resolve type
    };
  }

  /**
   * Make route object using request
   */
  private makeRouteObj(request: HttpDriverRequest): Route | undefined {
    const location: ParsedUrl = parseUrl(request.url);
    const { route, params } = this.resolveRoute(request.method, location.url);
    const eventName = `${request.method}${EVENT_NAME_DELIMITER}${route}`;
    const routeItem: RouteItem = this.registeredRoutes[eventName];

    if (!routeItem) return;

    // TODO: pinnedProps может не быть

    return {
      route,
      params,
      pinnedProps: routeItem.pinnedProps,
      location,
    };
  }

  private resolveRoute(method: HttpMethods, relativeUrl: string): { route: string, params: {[index: string]: string | number} } {
    const cleanUrl = this.prepareRoute(relativeUrl);
    const urlParts: string[] = cleanUrl.split(URL_DELIMITER);

    // TODO: лучше тримить каждую urlPart
    // TODO: ищем ближайший параметр :id - и все что до него это baseUrl


    // TODO: если это root - то выполнить этот роут
    // TODO: нужно учитывать method

    // TODO: это ещё не роут - это только url - нужно соотнести с шаблонами routes и поднять все совпадающие
    // TODO: resolve - parse params like :id
    // TODO: resolve numbers

    return {
      route: '',
      params: {},
    };
  }

  private prepareRoute(rawRoute: string): string {
    return trimChar(rawRoute, URL_DELIMITER);
  }

  // /**
  //  * Call this to handle calling of route
  //  */
  // onRequest(method: HttpMethods, route: string, cb: RouterRequestHandler): number {
  //
  //   // TODO: remove!!!!
  //
  //   const preparedRoute: string = this.prepareRoute(route);
  //
  //
  //   // const handlerWrapper = (parsedRoute: Route, request: HttpDriverRequest): Promise<HttpDriverResponse> => {
  //   //   if (parsedRoute.route !== route) return;
  //   //
  //   //   // TODO: cb returns a response !!!!
  //   //
  //   //   cb(parsedRoute, request);
  //   // }
  //
  //
  //   // TODO: cb returns a response !!!! этом может не обрабатываться в events
  //
  //   const eventName = `${method.toLowerCase()}${EVENT_NAME_DELIMITER}${preparedRoute}`;
  //
  //   return this.events.addListener(eventName, cb);
  // }

}
