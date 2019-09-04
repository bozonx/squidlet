import {JsonTypes} from '../interfaces/Types';
import {parseValue} from './common';


export const URL_DELIMITER = '/';

export interface ParsedUrl {
  protocol: string;
  user?: string;
  password?: string;
  host: string;
  port?: number;
  // relative part of url e.g / or /page/ or empty string
  url: string;
  search: {[index: string]: JsonTypes};
}


export function parseSearch(rawSearch: string): {[index: string]: JsonTypes} {
  if (!rawSearch) return {};

  const splat: string[] = rawSearch.split('&');
  const result: {[index: string]: any} = {};

  for (let item of splat) {
    const [key, value] = item.split('=');

    // TODO: support of lists

    result[key.trim()] = parseValue((value || '').trim() || undefined);
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

  const match = rawUrl.trim().match(/^([\w\d]+):\/\/([^\/]+)([^?]*)\??(.*)$/);

  if (!match) {
    throw new Error(`Can't parse url "${rawUrl}"`);
  }
  else if (!match[2]) {
    throw new Error(`Invalid auth and host part of url`);
  }

  const authHostSplat = match[2].split('@');

  return {
    protocol: match[1],
    url: match[3],
    search: parseSearch(match[4]),
    ...parseHostPort(authHostSplat[(authHostSplat.length === 2) ? 1 : 0]),
    ...(authHostSplat.length === 2) ? parseUserPassword(authHostSplat[0]) : {},
  };
}
