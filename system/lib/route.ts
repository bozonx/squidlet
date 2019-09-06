import {URL_DELIMITER} from './url';
import {trimCharEnd} from './strings';


export interface MatchRouteResult {
  route: string;
  basePath: string;
  params: {[index: string]: string | number};
}


/**
 * Remove trailing slash and add slash to the beginning if it doesn't have it
 */
export function prepareRoute(rawRoute: string): string {
  const trimmed = trimCharEnd(rawRoute.trim(), URL_DELIMITER);

  if (trimmed.indexOf(URL_DELIMITER)) return trimmed;

  return URL_DELIMITER + trimmed;
}

/**
 * Match urlPath with route and return route, basePath of route and route params.
 * Example: '/path/to/actionName/value1/' => {
 *   route: '/path/to/:action/:param1'
 *   basePath: /path/to
 *   params: { action: 'actionName', param1: 'value1' }
 * }
 * @param urlPath - path part of url
 * @param allRoutes - all the available routes
 */
export function matchRoute(urlPath: string, allRoutes: string[]): MatchRouteResult | undefined {
  const cleanUrl = this.prepareRoute(relativeUrl);
  const urlParts: string[] = cleanUrl.split(URL_DELIMITER);

  let compoundUrl: string = '';

  for (let urlPart of urlParts) {
    compoundUrl += ((compoundUrl) ? URL_DELIMITER : '') + urlPart;

    const newMatchedRoutes: string[] = [];

    for (let route of matchedRoutes) {

      //if (route.indexOf(urlPart) === 0) newMatchedRoutes.push();
    }

    // TODO: если это root - то выполнить этот роут


    // TODO: сделать рекурсивный поиск пути

    // TODO: лучше тримить каждую urlPart
    // TODO: ищем ближайший параметр :id - и все что до него это baseUrl

    // TODO: это ещё не роут - это только url - нужно соотнести с шаблонами routes и поднять все совпадающие
    // TODO: resolve - parse params like :id
    // TODO: resolve numbers

    // TODO: отсеиваем совпадения
  }
}
