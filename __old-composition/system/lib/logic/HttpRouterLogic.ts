import {JsonTypes, Primitives} from '../../../../../squidlet-lib/src/interfaces/Types';
import {ParsedUrl, parseUrl} from '../../../../../squidlet-lib/src/url';
import IndexedEvents from '../../../../../squidlet-lib/src/IndexedEvents';
import {matchRoute, MatchRouteResult, prepareRoute} from '../../../../../squidlet-lib/src/route';
import {HttpMethods} from '../../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/Http.js';
import {clearArray} from '../../../../../squidlet-lib/src/arrays';
// TODO: don't use dependencies
import {HttpDriverRequest, HttpDriverResponse} from '../../../../../squidlet-networking/src/drivers/HttpServer/HttpServerLogic';
import {omitUndefined} from '../../../../../squidlet-lib/src/objects';


const EVENT_NAME_DELIMITER = '|';


export interface Route {
  // string in format "method|path/to/route"
  routeId: string;
  // parsed url params like /path/to/:page => {page: 'myPageName'};
  params: {[index: string]: Primitives};
  // route which has been set in addRoute()
  route: string;
  location: ParsedUrl;
  pinnedProps?: {[index: string]: JsonTypes};
}

export type RouterRequestHandler = (route: Route, request: HttpDriverRequest) => Promise<HttpDriverResponse>;
export type RouterEnterHandler = (route: Route, request: HttpDriverRequest, response: HttpDriverResponse) => Promise<void>;

interface RouteItem {
  // full route
  routeId: string;
  route: string;
  method: HttpMethods;
  routeHandler: RouterRequestHandler;
  pinnedProps?: {[index: string]: JsonTypes};
}


export default class HttpRouterLogic {
  private readonly enterEvents = new IndexedEvents<RouterEnterHandler>();
  private readonly registeredRoutes: RouteItem[] = [];
  private readonly logDebug: (msg: string) => void;


  constructor(logDebug: (msg: string) => void) {
    this.logDebug = logDebug;
  }

  destroy() {
    this.enterEvents.destroy();
    clearArray(this.registeredRoutes);
  }


  /**
   * Call this to register a new route and its params.
   */
  addRoute(
    method: HttpMethods,
    route: string,
    routeHandler: RouterRequestHandler,
    pinnedProps?: {[index: string]: JsonTypes}
  ) {
    const preparedRoute: string = prepareRoute(route);
    const preparedMethod = method.toLowerCase() as HttpMethods;
    const routeId = this.makeRouteId(preparedMethod, preparedRoute);

    this.registeredRoutes.push({
      routeId,
      route: preparedRoute,
      method: preparedMethod,
      routeHandler,
      pinnedProps
    });
  }

  /**
   * Call this only when a new request came.
   */
  async incomeRequest(request: HttpDriverRequest): Promise<HttpDriverResponse> {
    // TODO: для коротких url - надо задавать начальный slash его нет - проверить
    const location: ParsedUrl = parseUrl(request.url);

    if (!location.path) {
      return {
        status: 404,
        body: `Not specified path part of url "${request.url}"`
      };
    }

    const matchedRoute: MatchRouteResult | undefined = this.resolveRoute(request.method, location.path);
    const routeItem: RouteItem | undefined = this.findRoute(
      request.method,
      matchedRoute && matchedRoute.route
    );

    if (!matchedRoute || !routeItem) {
      return {
        status: 404,
        body: `route for url "${request.url}" isn't registered!`
      };
    }

    const routeObj: Route = this.makeRouteObj(location, routeItem, matchedRoute);
    const response: HttpDriverResponse = await routeItem.routeHandler(
      routeObj,
      request
    );

    this.enterEvents.emit(routeObj, request, response);

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


  private findRoute(method: HttpMethods, route?: string): RouteItem | undefined {
    if (!route) return;

    const routeId: string = this.makeRouteId(method, route);

    return this.registeredRoutes.find((item) => item.routeId === routeId);
  }

  /**
   * Make route object using request
   */
  private makeRouteObj(
    location: ParsedUrl,
    routeItem: RouteItem,
    matchedRoute: MatchRouteResult,
  ): Route {
    const route: Route = {
      routeId: routeItem.routeId,
      route: matchedRoute.route,
      params: matchedRoute.params,
      pinnedProps: routeItem.pinnedProps,
      location,
    };

    return omitUndefined(route) as Route;
  }

  private resolveRoute(method: HttpMethods, urlPath: string): MatchRouteResult | undefined {
    const LENGTH_OF_DELIMITER = 1;
    const pathOfIdToStripLength: number = method.length + LENGTH_OF_DELIMITER;
    // routes matched to method and stripped - only route path of id.
    const routesMatchedToMethod: string[] = this.registeredRoutes
      .filter((item): boolean => item.routeId.indexOf(method as string) === 0)
      .map((item) => item.routeId.slice(pathOfIdToStripLength));

    if (!routesMatchedToMethod.length) return;

    return matchRoute(urlPath, routesMatchedToMethod);
  }

  private makeRouteId(method: HttpMethods, route: string): string {
    return `${method.toLowerCase()}${EVENT_NAME_DELIMITER}${route}`;
  }

}
