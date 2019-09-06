import {JsonTypes} from '../interfaces/Types';
import {trimChar} from './strings';
import {ParsedUrl, parseUrl, URL_DELIMITER} from './url';
import IndexedEvents from './IndexedEvents';
// TODO: don't use dependencies
import {HttpMethods} from '../interfaces/io/HttpServerIo';
// TODO: don't use dependencies
import {HttpDriverRequest, HttpDriverResponse} from '../../entities/drivers/HttpServer/HttpServerLogic';
import {clearObject} from './objects';
import {response} from 'express';


const EVENT_NAME_DELIMITER = '|';


export interface Route {
  // string in format "method|path/to/route"
  routeId: string;
  // parsed url params like /path/to/:page => {page: 'myPageName'};
  params: {[index: string]: string | number};
  // route which has been set in addRoute()
  route: string;
  location: ParsedUrl;
  pinnedProps?: {[index: string]: JsonTypes};
}

export type RouterRequestHandler = (route: Route, request: HttpDriverRequest) => Promise<HttpDriverResponse>;
export type RouterEnterHandler = (route: Route, request: HttpDriverRequest, response: HttpDriverResponse) => Promise<void>;

interface RouteItem {
  // full route
  route: string;
  method: HttpMethods;
  routeHandler: RouterRequestHandler;
  pinnedProps?: {[index: string]: JsonTypes};
}


export default class HttpRouterLogic {
  private readonly enterEvents = new IndexedEvents<RouterEnterHandler>();
  private readonly registeredRoutes: {[index: string]: RouteItem} = {};
  private readonly logDebug: (msg: string) => void;


  constructor(logDebug: (msg: string) => void) {
    this.logDebug = logDebug;
  }

  destroy() {
    this.enterEvents.removeAll();
    clearObject(this.registeredRoutes);
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
    const routeId = this.makeRouteId(preparedMethod, preparedRoute);

    this.registeredRoutes[routeId] = {
      route: preparedRoute,
      method: preparedMethod,
      routeHandler,
      pinnedProps
    };
  }

  /**
   * Call this only when a new request came.
   */
  async incomeRequest(request: HttpDriverRequest): Promise<HttpDriverResponse> {
    const parsedRoute: Route | undefined = this.makeRouteObj(request);

    if (!parsedRoute) {
      return {
        status: 404,
        body: `route for url "${request.url}: isn't registered!`
      };
    }

    const response: HttpDriverResponse = await this.registeredRoutes[parsedRoute.routeId].routeHandler(
      parsedRoute,
      request
    );

    this.enterEvents.emit(parsedRoute, request, response);

    return response;
  }

  /**
   * Listen to all the requests to all the routes
   */
  onEnter(cb: RouterEnterHandler): number {
    return this.enterEvents.addListener(cb);
  }

  removeEnterListener(handlerIndex: number) {
    this.enterEvents.removeListener(handlerIndex);
  }


  /**
   * Make route object using request
   */
  private makeRouteObj(request: HttpDriverRequest): Route | undefined {
    const location: ParsedUrl = parseUrl(request.url);
    const { route, params } = this.resolveRoute(request.method, location.path);
    const routeId = this.makeRouteId(request.method, route);
    const routeItem: RouteItem = this.registeredRoutes[routeId];

    if (!routeItem) return;

    return {
      routeId,
      route,
      params,
      pinnedProps: routeItem.pinnedProps,
      location,
    };
  }

  private resolveRoute(
    method: HttpMethods,
    relativeUrl: string
  ): { route: string, params: {[index: string]: string | number}} | undefined {
    const cleanUrl = this.prepareRoute(relativeUrl);
    const urlParts: string[] = cleanUrl.split(URL_DELIMITER);
    const pathOfIdToStripLength: number = method.length + 1;
    // routes matched to method
    const matchedMethodRoutes: string[] = Object.keys(this.registeredRoutes)
      .filter((routeId: string): boolean => {
        return routeId.indexOf(method as string) === 0;
      })
      .map((routeId: string) => routeId.slice(0, pathOfIdToStripLength));

    if (!matchedMethodRoutes.length) return;

    let compoundUrl: string = '';

    for (let urlPart of urlParts) {
      compoundUrl += ((compoundUrl) ? URL_DELIMITER : '') + urlPart;



      // TODO: отсеиваем совпадения
    }

    // TODO: сделать рекурсивный поиск пути

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
    return trimChar(rawRoute.trim(), URL_DELIMITER);
  }

  private makeRouteId(method: HttpMethods, route: string): string {
    return `${method.toLowerCase()}${EVENT_NAME_DELIMITER}${route}`;
  }

}
