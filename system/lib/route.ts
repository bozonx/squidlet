import {URL_DELIMITER} from './url';


export interface MatchRouteResult {
  route: string;
  basePath: string;
  params: {[index: string]: string | number};
}


/**
 * Match url with route and return route, basePath of route and route params.
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


    // TODO: сделать рекурсивный поиск пути

    // TODO: лучше тримить каждую urlPart
    // TODO: ищем ближайший параметр :id - и все что до него это baseUrl

    // TODO: это ещё не роут - это только url - нужно соотнести с шаблонами routes и поднять все совпадающие
    // TODO: resolve - parse params like :id
    // TODO: resolve numbers

    // TODO: отсеиваем совпадения
  }
}
