const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');
const _capitalize = require('lodash/capitalize');
const _omit = require('lodash/omit');
const _isEqual = require('lodash/isEqual');
const _trim = require('lodash/trim');
const _padStart = require('lodash/padStart');

// TODO: test


export function isEmpty(toCheck: any): boolean {
  if (typeof toCheck == 'undefined' || toCheck === null || toCheck === '') return true;
  if (toCheck instanceof Array && !toCheck.length) return true;
  if (typeof toCheck === 'object' && !Object.keys(toCheck).length) return true;

  return false;
}

export function values(obj: {[index: string]: any}): any[] {
  return Object.keys(obj).map(key => obj[key]);
}

export function capitalize(...p: any[]) {

  // TODO: remake

  return _capitalize(...p);
}

export function omit(...p: any[]) {

  // TODO: remake

  return _omit(...p);
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
    throw new Error(`find: unsupported type of collection`);
  }
}

export function trim(...p: any[]) {
  // TODO: remake
  return _trim(...p);
}

export function padStart(...p: any[]) {
  // TODO: remake
  return _padStart(...p);
}

export function last(arr: any[]) {
  return arr[arr.length - 1];
}

export function trimEnd(stringToTrim: string, chars: string): string {
  const regex = new RegExp(`\\${chars}+$`);

  return stringToTrim.replace(regex, '');
}


export function defaultsDeep(...p: any[]) {
  // TODO: remake - to merge deep
  return _defaultsDeep(...p);
}

export function cloneDeep(...p: any[]) {
  // TODO: remake
  return _cloneDeep(...p);
}

export function isEqual(...p: any[]) {

  // TODO: remake - use deep equal

  return _isEqual(...p);
}
