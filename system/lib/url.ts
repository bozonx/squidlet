import {JsonTypes} from '../interfaces/Types';

// TODO: add null support

export const URL_DELIMITER = '/';

interface LeftPartOfUrl {
  // protocol
  scheme: string;
  user?: string;
  password?: string;
  host: string;
  port?: number;
}

interface RightPartOfUrl {
  // relative part of url e.g / or /page/ or empty string
  path: string;
  search: {[index: string]: JsonTypes};
  anchor?: string;
}

export interface ParsedUrl {
  // protocol
  scheme?: string;
  user?: string;
  password?: string;
  host?: string;
  port?: number;
  // relative part of url e.g / or /page/ or empty string
  path?: string;
  search?: {[index: string]: JsonTypes};
  anchor?: string;
}

//const match = decodedUrl.trim().match(/^([\w\d]+:?\/?)\/?([^\/]+)([^?]*)\??(.*)$/);

// protocol, username, password, host, port
const leftUrlPartRegex = ''
  + /(?:(?:(https?|ftp):)?\/\/)/.source     // protocol
  + /(?:([^:\n\r]+):([^@\n\r]+)@)?/.source  // user:pass
  + /(?:(?:www\.)?([^\/\n\r]+))/.source     // domain
  //+ /(\/[^?\n\r]+)?/.source                 // request
;
const urlPathRegex = ''
  + /(\/?[^?\n\r]+)?/.source                 // request
  + /(\?[^#\n\r]*)?/.source                 // query
  + /(#?[^\n\r]*)?/.source                  // anchor
;

/**
 * Parses value of search param.
 * Pass it already url decoded.
 * It supports arrays and objects in JSON format like:
 * * param1=[1, true, "str"]
 * * param1={"a": "str", "b": 5, "c": true}
 * Params which defined without value will have an empty string as a value according to URLSearchParams:
 * * param1&param2=2 => { param1: '', param2: 2 }
 */
export function parseSearchValue(rawValue: string | undefined): JsonTypes {
  if (!rawValue) return '';

  const trimmed: string = rawValue.trim();

  if (!trimmed) return '';

  try {
    return JSON.parse(trimmed);
  }
  catch (e) {
    return trimmed;
  }
}

export function parseSearch(rawSearch: string): {[index: string]: JsonTypes} {
  if (!rawSearch) return {};

  const splat: string[] = rawSearch.split('&');
  const result: {[index: string]: any} = {};

  for (let item of splat) {
    const [key, value] = item.split('=');

    result[key.trim()] = parseSearchValue(value);
  }

  return result;
}

export function parseHostPort(rawStr: string): { host: string, port?: number } {
  if (!rawStr) {
    throw new Error(`Invalid host part of url`);
  }

  const splat = rawStr.split(':');

  if (splat.length > 2) {
    throw new Error(`Invalid format of host:port - more than 2 parts`);
  }
  else if (splat.length === 2) {
    const portNum: number = Number(splat[1]);

    if (Number.isNaN(portNum)) throw new Error(`Invalid port number`);

    return { host: splat[0], port: portNum };
  }

  return { host: splat[0] };
}

export function parseUserPassword(rawStr: string): {user?: string; password?: string} {
  if (!rawStr) return {};

  const splat = rawStr.split(':');

  if (splat.length > 2) {
    throw new Error(`Invalid format of user:passwort - more than 2 parts`);
  }
  else if (splat.length === 2) {
    return { user: splat[0], password: splat[1] };
  }

  return { user: splat[0] };
}

export function parseUrl(rawUrl: string): ParsedUrl {
  if (!rawUrl) throw new Error(`Invalid url "${rawUrl}"`);

  const decodedUrl = decodeURI(rawUrl).trim();
  const splitUrlMatch = decodedUrl.match(/^([^\/]*)(.*)$/);

  if (!splitUrlMatch) throw new Error(`Can't parse url "${decodedUrl}"`);

  if (splitUrlMatch[2]) {
    // full url
    return {
      ...parseLeftPartOfUrl(splitUrlMatch[1]),
      ...parseRightPartOfUrl(splitUrlMatch[2]),
    };
  }
  else {
    // only path or only first part
    if (splitUrlMatch[1].match(/[\/#?&%]/)) {
      // path part
      return {
        ...parseRightPartOfUrl(splitUrlMatch[1]),
      };
    }
    else if (splitUrlMatch[1].match(/[:.@]/)) {
      return {
        ...parseLeftPartOfUrl(splitUrlMatch[1]),
      };
    }

    return {
      host: splitUrlMatch[1],
    };
  }
}


export function parseLeftPartOfUrl(url: string): LeftPartOfUrl {
  // else parse a path
  const match = url.match(leftUrlPartRegex);

  console.log(11111111, match)

  if (!match) {
    throw new Error(`Can't parse url "${url}"`);
  }
  else if (!match[2]) {
    throw new Error(`Invalid auth and host part of url`);
  }

  const authHostSplat = match[2].split('@');

  return {
    scheme: match[1],
    ...parseHostPort(authHostSplat[(authHostSplat.length === 2) ? 1 : 0]),
    ...(authHostSplat.length === 2) ? parseUserPassword(authHostSplat[0]) : {},
  };
}

export function parseRightPartOfUrl(url: string): RightPartOfUrl {
  const match = url.match(urlPathRegex);

  if (!match) {
    throw new Error(`Can't parse url "${url}"`);
  }

  console.log(11111111, match)

  return {
    path: match[1],
    search: parseSearch(match[2]),
    anchor: match[3],
  };
}
