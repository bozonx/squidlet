import {JsonTypes} from '../interfaces/Types';
import {omitUndefined} from './objects';


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
  search?: {[index: string]: JsonTypes};
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


/**
 * Parses whole url
 * WARNING: be careful with the next type of urls
 * * to/route - will be recognized as host "to" and path "/route"
 * * localhost#anchor - it is allowed but better to use slash - localhost/#anchor
 */
export function parseUrl(rawUrl: string): ParsedUrl {
  if (!rawUrl) throw new Error(`Invalid url "${rawUrl}"`);

  const decodedUrl = decodeURIComponent(rawUrl.trim());
  const { left, right } = splitUrl(decodedUrl);

  return {
    ...(left) ? parseLeftPartOfUrl(left) : {},
    ...(right) ? parseRightPartOfUrl(right) : {},
  };
}

// protocol, username, password, host, port
const leftUrlPartRegex = '^' +
  '(([a-z0-9]+)://)?' + // protocol
  '(([^@]+)@)?' +            // user:pass
  '([^/]+)'+ // domain:port
  //'([a-zA-Z0-9.\\-\:]+)'+ // domain:port
  '.*$';

const urlPathRegex = ''
  + /(\/?[^?#\n\r]+)?/.source                 // request
  + /\??/.source
  + /([^#\n\r]*)?/.source                    // query
  + /#?/.source
  + /([^\n\r]*)?/.source                     // anchor
;

// const fullRegExp = '^' +
//   '([a-z0-9]+://)?' + // protocol
//   '([^@]+@)?' +            // user:pass
//   '([a-zA-Z0-9.\\-\:]+)(?!/)' + // domain
//   '(/?.*)' +
//   '$';

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

  // TODO: why not undefined ???
  if (!trimmed) return '';

  try {
    return JSON.parse(trimmed);
  }
  catch (e) {
    return trimmed;
  }
}

/**
 * Parse search part of url. Arrays and objects are supported:
 * * param1=value1&param2&param3=5&param4=true => { param1: 'value1', param2: '', param3: 5, param4: true }
 * * param1=[1, true, "str"] => { param1: [1, true, 'str'] }
 * * param1={"a": "str", "b": 5, "c": true} => { param1: {a: "str", b: 5, c: true} }
 */
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

/**
 * Parse string:
 * * "host.com:8080" => { host: 'host.com', port: 8080 }
 * * "host.com" => { host: 'host.com' }
 */
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

/**
 * Parse string like:
 * * "userName:password" => { user: 'userName', password: 'password' }
 * * "userName" => { user: 'userName' }
 */
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

/**
 * Parses protocol, username, password, hostname and port of url
 */
export function parseLeftPartOfUrl(url: string): LeftPartOfUrl {
  // else parse a path
  const match = url.match(new RegExp(leftUrlPartRegex));

  if (!match) {
    throw new Error(`Can't parse url "${url}"`);
  }

  const result: LeftPartOfUrl = {
    scheme: match[2],
  ...(match[4]) ? parseUserPassword(match[4]) : {},
  ...parseHostPort(match[5]),
  };

  return omitUndefined(result) as LeftPartOfUrl;
}

/**
 * Parses path, search and anchor.
 */
export function parseRightPartOfUrl(url: string): RightPartOfUrl {
  const match = url.match(urlPathRegex);

  if (!match) {
    throw new Error(`Can't parse url "${url}"`);
  }

  const result: RightPartOfUrl = {
    path: match[1],
    search: (match[2]) ? parseSearch(match[2]) : undefined,
    anchor: match[3],
  };

  return omitUndefined(result) as RightPartOfUrl;
}

/**
 * Split url to left and rigth parts.
 */
export function splitUrl(url: string): { left?: string, right?: string } {
  // TODO: в пароле наверное разрешенно больше символов
  const splitUrlMatch = url.match(/^(([^:]+:\/\/)?[a-zA-Z0-9.\-:@]*)(.*)$/);

  if (!splitUrlMatch) throw new Error(`Can't recognize parts of url "${url}"`);

  if (splitUrlMatch[3]) {
    // full url
    return omitUndefined({
      left: splitUrlMatch[1] || undefined,
      right: splitUrlMatch[3],
    });
  }
  else {
    // only path or only first part
    if (splitUrlMatch[1].match(/[:.@]/)) {
      return {
        left: splitUrlMatch[1],
      };
    }
    else if (splitUrlMatch[1].match(/[\/#?&%]/)) {
      // path part
      return {
        right: splitUrlMatch[1],
      };
    }

    return {
      left: splitUrlMatch[1],
    };
  }

}
