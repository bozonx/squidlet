declare const btoa: ((data: any) => any) | undefined;
declare const atob: ((data: any) => any) | undefined;


export function base64ToString(str: string): string {
  if (typeof btoa === 'undefined') {
    return Buffer.from(str).toString('base64');
  }

  return btoa(str);
}

export function stringTobase64(base64Str: string): string {
  if (typeof atob === 'undefined') {
    return Buffer.from(base64Str, 'base64').toString();
  }

  return atob(base64Str);
}

/**
 * Turn only the first letter to upper case
 */
export function firstLetterToUpperCase(value: string): string {
  if (!value) return value;

  const split: string[] = value.split('');

  split[0] = split[0].toUpperCase();

  return split.join('');
}

/**
 * Split first element of path using separator. 'path/to/dest' => [ 'path', 'to/dest' ]
 */
export function splitFirstElement(
  fullPath: string,
  separator: string
): [ string, string | undefined ] {
  if (!fullPath) throw new Error(`fullPath param is required`);
  if (!separator) throw new Error(`separator is required`);

  const split: string[] = fullPath.split(separator);
  const first: string = split[0];

  if (split.length === 1) {
    return [ fullPath, undefined ];
  }

  return [ first, split.slice(1).join(separator) ];
}

/**
 * Split last part of path. 'path/to/dest' => [ 'dest', 'path/to' ]
 */
export function splitLastElement(
  fullPath: string,
  separator: string
): [ string, string | undefined ] {
  if (!fullPath) throw new Error(`fullPath param is required`);
  if (!separator) throw new Error(`separator is required`);

  const split = fullPath.split(separator);
  const last: string = split[split.length - 1];

  if (split.length === 1) {
    return [ fullPath, undefined ];
  }

  // remove last element from path
  split.pop();

  return [ last, split.join(separator) ];
}



/*
import * as querystring from 'querystring';

const splitUrl: string[] = (request.url as any).split('?');
const getParams: {clientId: string} = querystring.parse(splitUrl[1]) as any;
const clientId: string = getParams.clientId;
 */
