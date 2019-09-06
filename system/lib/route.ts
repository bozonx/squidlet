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
  const cleanUrl = prepareRoute(urlPath);

  const filteredRoutes: string[] = filterRoutes(cleanUrl, allRoutes);

  if (!filteredRoutes.length) return;

  return parseRouteString(filteredRoutes[0]);

  // TODO: test root route

  //const urlParts: string[] = cleanUrl.split(URL_DELIMITER);
  // let compoundUrl: string = '';
  // let matchedRoutes = [...allRoutes];

  // for (let urlPart of urlParts) {
  //   compoundUrl += ((compoundUrl) ? URL_DELIMITER : '') + urlPart;
  //
  //   const newMatchedRoutes: string[] = [];
  //
  //   for (let route of matchedRoutes) {
  //     // not matched
  //     if (route.indexOf(compoundUrl) !== 0) continue;
  //
  //     //if (route.indexOf(urlPart) === 0) newMatchedRoutes.push();
  //   }
  //
  //
  // }
}

export function filterRoutes(urlPath: string, allRoutes: string[]): string[] {
  const result: string[] = [];

  // TODO: а что если нет прям полгого совпадения в параметрах ????

  for (let route of allRoutes) {
    const regExpStr = route.replace(/:[^\/]/g, '[^\\/]*');

    if (urlPath.match(new RegExp(regExpStr))) {
      result.push(route);
    }
  }

  return result;
}

export function parseRouteString(routeStr: string): MatchRouteResult {
  //   // TODO: ищем ближайший параметр :id - и все что до него это baseUrl

}
