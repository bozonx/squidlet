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

function parseHostPort(rasStr: string): { host: string, port?: number } {

}

function parseUserPassword(rasStr: string): {user?: string; password?: string} {

}

function parseAuthHostPart(rawStr: string): {host: string; port?: number; user?: string; password?: string} {
  if (!rawStr) throw new Error(`Invalid auth and host part of url`);

  const splat = rawStr.split('@');

  return {
    ...parseHostPort(splat[(splat.length === 2) ? 2 : 1]),
    ...(splat.length === 2) ? parseUserPassword(splat[1]) : undefined,
  };
}

export function parseUrl(rawUrl: string): ParsedUrl {
  if (!rawUrl) throw new Error(`Invalid url "${rawUrl}"`);

  const match = rawUrl.trim().match(/^([\w\d]+):\/\/([^\/]+)([^?]*)\??(.*)$/);

  if (!match) throw new Error(`Can't parse url "${rawUrl}"`);

  return {
    protocol: match[1],
    url: match[3],
    search: parseSearch(match[4]),
    ...parseAuthHostPart(match[2]),
  };
}
