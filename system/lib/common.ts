import {isEqualUint8Array} from './binaryHelpers';
import {arraysDifference} from './arrays';


/**
 * Compare any types and check equality of two values.
 */
export function isEqual(first: any, second: any): boolean {
  // primitives
  if (typeof first !== 'object' || typeof second !== 'object') {
    return first === second;
  }
  // uint
  else if (first instanceof Uint8Array || second instanceof Uint8Array) {
    return isEqualUint8Array(first, second);
  }
  // arrays
  else if (Array.isArray(first) && Array.isArray(second)) {
    if (first.length !== second.length) return false;

    for (let key in first) {
      // TODO: собрать
      isEqual(first[key], second[key]);
    }
  }
  // plain objects and instances
  else if (typeof first === 'object' && typeof second === 'object') {

    // TODO: use getDifferentKeys ???

    const firstKeys: string[] = Object.keys(first);
    // if keys are different = aren't equal
    if (arraysDifference(firstKeys, Object.keys(second)).length) return false;

    for (let key of firstKeys) {
      // TODO: собрать
      isEqual(first[key], second[key]);
    }
  }

  // for the any other case when smb is undefined of for null compare
  return first === first;
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


// /**
//  * When undefined, null, '', [] or {}.
//  * 0 is not empty!
//  * @param toCheck
//  */
