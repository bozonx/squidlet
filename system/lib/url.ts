import {JsonTypes} from '../interfaces/Types';


export const URL_DELIMITER = '/';

export interface ParsedUrl {
  // protocol
  scheme: string;
  user?: string;
  password?: string;
  host: string;
  port?: number;
  // relative part of url e.g / or /page/ or empty string
  path: string;
  search: {[index: string]: JsonTypes};
}


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

  const decodedUrl = decodeURI(rawUrl);
  const match = decodedUrl.trim().match(/^([\w\d]+):\/\/([^\/]+)([^?]*)\??(.*)$/);

  if (!match) {
    throw new Error(`Can't parse url "${decodedUrl}"`);
  }
  else if (!match[2]) {
    throw new Error(`Invalid auth and host part of url`);
  }

  const authHostSplat = match[2].split('@');

  return {
    scheme: match[1],
    path: match[3],
    search: parseSearch(match[4]),
    ...parseHostPort(authHostSplat[(authHostSplat.length === 2) ? 1 : 0]),
    ...(authHostSplat.length === 2) ? parseUserPassword(authHostSplat[0]) : {},
  };
}
