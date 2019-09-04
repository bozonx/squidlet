import {JsonTypes} from '../interfaces/Types';


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


function parseSearch(rawSearch: string): {[index: string]: JsonTypes} {
  if (!rawSearch) return {};

  // TODO: add - see cookies
}

export function parseHostPort(rawStr: string): { host: string, port?: number } {
  if (!rawStr) {
    throw new Error(`Invalid host part of url`);
  }

  const splat = rawStr.split(':');

  if (splat.length > 1) {
    const portNum: number = Number(splat[2]);

    if (Number.isNaN(portNum)) throw new Error(`Invalid port number`);

    return { host: splat[1], port: portNum };
  }

  return { host: splat[1] };
}

export function parseUserPassword(rawStr: string): {user?: string; password?: string} {
  if (!rawStr) return {};


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
    ...parseHostPort(authHostSplat[(authHostSplat.length === 2) ? 2 : 1]),
    ...(authHostSplat.length === 2) ? parseUserPassword(authHostSplat[1]) : undefined,
  };
}
