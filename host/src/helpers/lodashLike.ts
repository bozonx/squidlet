import {isUint8Array} from './helpers';

const _padStart = require('lodash/padStart');

// TODO: test

/**
 * When undefined, null, '', [] or {}.
 * 0 is not empty!
 * @param toCheck
 */
export function isEmpty(toCheck: any): boolean {
  if (typeof toCheck == 'undefined' || toCheck === null || toCheck === '') return true;
  else if (toCheck instanceof Array && !toCheck.length) return true;
  else if (typeof toCheck === 'object' && !Object.keys(toCheck).length) return true;

  return false;
}

export function values(obj: {[index: string]: any}): any[] {
  return Object.keys(obj).map(key => obj[key]);
}

export function omit(obj: {[index: string]: any}, ...propToExclude: string[]): {[index: string]: any} {
  const result: {[index: string]: any} = {};

  for (let key of Object.keys(obj)) {
    if (propToExclude.indexOf(key) < 0) {
      result[key] = obj[key];
    }
  }

  return result;
}

export function find(collection: any[] | {[index: string]: any}, cb: (item: any, index: string | number) => any | undefined): any | undefined {
  if (typeof collection === 'undefined' || collection === null) {
    return;
  }
  else if (Array.isArray(collection)) {
    for (let index in collection) {
      const result: any | undefined = cb(collection[index], parseInt(index));

      if (result) return result;
    }
  }
  else if (typeof collection === 'object') {
    for (let key of Object.keys(collection)) {
      const result: any | undefined = cb(collection[key], key);

      if (result) return result;
    }
  }
  else {
    throw new Error(`find: unsupported type of collection "${JSON.stringify(collection)}"`);
  }
}

export function trimStart(src: string, char: string = ' '): string {
  if (typeof src !== 'string') return src;

  const regex = new RegExp(`^\\${char}*`);

  return src.replace(regex, '');
}

export function trimEnd(src: string, char: string = ' '): string {
  if (typeof src !== 'string') return src;

  const regex = new RegExp(`\\${char}*$`);

  return src.replace(regex, '');
}

export function trim(src: string, char: string = ' '): string {
  return trimEnd( trimStart(src, char), char);
}

export function padStart(...p: any[]) {
  // TODO: remake
  return _padStart(...p);
}

export function last(arr: any[]) {
  return arr[arr.length - 1];
}

export function cloneDeep(value: any): any {
  // not cloneable
  if (
    value === null
    || typeof value === 'number'
    || typeof value === 'undefined'
    || typeof value === 'function'
  ) {
    return value;
  }
  if (typeof value === 'string') {
    return '' + value;
  }
  else if (isUint8Array(value)) {
    const oldArr: Uint8Array = value;
    const newArr: Uint8Array = new Uint8Array(oldArr.length);

    for (let index in oldArr) newArr[index] = value[index];

    return newArr;
  }
  else if (isPlainObject(value) || Array.isArray(value)) {
    // arrays or plain object. Don't support of class instances.
    return JSON.parse(JSON.stringify(value));
  }

  throw new Error(`cloneDeep: unsupported type of value "${JSON.stringify(value)}"`);
}

export function isEqual(first: any, second: any): boolean {
  if (
    first === null
    || typeof first === 'string'
    || typeof first === 'number'
    || typeof first === 'undefined'
    || typeof first === 'function'
    || second === null
    || typeof second === 'string'
    || typeof second === 'number'
    || typeof second === 'undefined'
    || typeof second === 'function'
  ) {
    return first === second;
  }
  else if (typeof first !== 'undefined' && typeof second === 'undefined') {
    return false;
  }
  else if (typeof first === 'undefined' && typeof second !== 'undefined') {
    return false;
  }
  else if (isUint8Array(first) && isUint8Array(second)) {
    return first.toString() === second.toString();
  }

  return JSON.stringify(first) === JSON.stringify(second);
}

export function isObject(item: any): boolean {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function isPlainObject(obj: any): boolean {
  return  typeof obj === 'object' // separate from primitives
    && obj !== null         // is obvious
    && obj.constructor === Object // separate instances (Array, DOM, ...)
    && Object.prototype.toString.call(obj) === '[object Object]'; // separate build-in like Math
}
