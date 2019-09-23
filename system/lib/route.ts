import {URL_DELIMITER} from './url';
import {trimCharEnd, trimCharStart} from './strings';
import {Primitives} from '../interfaces/Types';
import {parseValue} from './common';


const PARAM_MARK = ':';

export interface MatchRouteResult {
  route: string;
  params: {[index: string]: Primitives};
}


/**
 * Remove trailing slash and add slash to the beginning if it doesn't have it
 */
export function prepareRoute(rawRoute: string): string {
  if (rawRoute === URL_DELIMITER) return rawRoute;

  const trimmed = trimCharEnd(rawRoute.trim(), URL_DELIMITER);

  if (trimmed.indexOf(URL_DELIMITER) === 0) return trimmed;

  return URL_DELIMITER + trimmed;
}

/**
 * Match urlPath with route and return route and route params.
 * Example: '/path/to/actionName/value1/' => {
 *   route: '/path/to/:action/:param1'
 *   params: { action: 'actionName', param1: 'value1' }
 * }
 * @param urlPath - path part of url
 * @param allRoutes - all the available routes
 */
export function matchRoute(urlPath: string, allRoutes: string[]): MatchRouteResult | undefined {
  const cleanUrl = prepareRoute(urlPath);

  const filteredRoutes: string[] = filterRoutes(cleanUrl, allRoutes);

  if (!filteredRoutes.length) return;

  const foundRoute: string = filteredRoutes[0];

  return {
    route: foundRoute,
    params: parseRouteParams(urlPath, foundRoute),
  };
}

export function filterRoutes(urlPath: string, allRoutes: string[]): string[] {
  const result: string[] = [];

  for (let route of allRoutes) {
    const patternFindParam = `${PARAM_MARK}[^\\/]+`;
    const patternMatchUrl = route.replace(new RegExp(patternFindParam, 'g'), '[^\\/]*');

    // if use this then shorter routes will be matched too
    //if (urlPath.match(new RegExp(patternMatchUrl))) {
    if (urlPath.match(new RegExp(`^${patternMatchUrl}$`))) {
      result.push(route);
    }
  }

  return result;
}

/**
 * Parse params. Example:
 * * url: /path/to/action/myAction/sub-url/5/true
 * * params: /path/to/action/:actionName/sub-url/:param1/:param2
 * * result: { actionName: 'myAction', param1: 5, param2: true }
 */
export function parseRouteParams(url: string, route: string): {[index: string]: Primitives} {
  if (!route.match(PARAM_MARK)) return {};

  const params: {[index: string]: Primitives} = {};
  const routeSplat: string[] = trimCharStart(route, URL_DELIMITER).split(URL_DELIMITER);
  const urlSplat: string[] = trimCharStart(url, URL_DELIMITER).split(URL_DELIMITER);

  for (let itemIndex in routeSplat) {
    if (routeSplat[itemIndex].indexOf(PARAM_MARK) !== 0) continue;
    params[routeSplat[itemIndex].slice(1)] = parseValue(urlSplat[itemIndex]);
  }

  return params;
}
