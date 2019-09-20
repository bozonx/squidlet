import {isEqualUint8Array} from './binaryHelpers';
import {isEqualArrays} from './arrays';
import {isEqualObjects} from './objects';


/**
 * Compare any types and check equality of two values.
 */
export function isEqual(first: any, second: any): boolean {
  if (typeof first !== 'object' || typeof second !== 'object') {
    return first === second;
  }

  else if (first instanceof Uint8Array || second instanceof Uint8Array) {
    return isEqualUint8Array(first, second);
  }
  else if (Array.isArray(first) || Array.isArray(second)) {
    return isEqualArrays(first, second);
  }
  // plain objects and instances
  else if (typeof first === 'object' || typeof second === 'object') {
    return isEqualObjects(first, second);
  }

  // for the any other case e.g null
  return JSON.stringify(first) === JSON.stringify(second);
}

/**
 * Parse string numbers and constants to pure numbers and constants
 */
export function parseValue(rawValue: any): any {
  if (typeof rawValue !== 'string') {
    return rawValue;
  }
  else if (rawValue === 'true') {
    return true;
  }
  else if (rawValue === 'false') {
    return false;
  }
  else if (rawValue === 'undefined') {
    return undefined;
  }
  else if (rawValue === 'null') {
    return null;
  }
  else if (rawValue === 'NaN') {
    return NaN;
  }
  // it is for - 2. strings
  else if (rawValue.match(/^\d+\.$/)) {
    return rawValue;
  }

  const toNumber = Number(rawValue);

  if (!Number.isNaN(toNumber)) {
    // it's number
    return toNumber;
  }

  // string returns as they are
  return rawValue;
}

/**
 * Call error-first callback functions like a promised
 */
export function callPromised(method: Function, ...params: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      method(...params, (err: Error, data: any) => {
        if (err) return reject(err);

        resolve(data);
      });
    }
    catch (err) {
      reject(err);
    }
  });
}

/**
 * Is number or number as string.
 */
export function isKindOfNumber(value: any): boolean {
  if (typeof value === 'string') {
    return !Number.isNaN(Number(value));
  }

  return typeof value === 'number';
}
