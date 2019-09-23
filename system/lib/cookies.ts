import {Primitives} from '../interfaces/Types';
import {parseValue} from './common';


/**
 * Parse cookie like "param1=value1; param2=value2;" to { param1: 'value1', param2: 'value2' }
 * example - lang=ru-RU; gdpr-cookie-consent=accepted;
 */
export function parseCookie(cookies?: string): {[index: string]: Primitives} {
  if (!cookies) return {};

  const splat: string[] = cookies.split(';');
  const result: {[index: string]: Primitives} = {};

  for (let item of splat) {
    const [key, value] = item.split('=');

    result[key.trim()] = parseValue((value || '').trim());
  }

  return result;
}

export function stringifyCookie(obj: {[index: string]: Primitives}): string {
  const result: string[] = [];

  for (let key of Object.keys(obj)) {
    const value: Primitives | undefined = obj[key];

    if (value && typeof value === 'object') {
      throw new Error(`stringifyCookie: invalid type of value: ${typeof value}`);
    }

    result.push(`${key}=${value}`);
  }

  return result.join('; ');
}
