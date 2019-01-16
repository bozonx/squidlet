import * as uniqid from 'uniqid';

import {ALL_TOPICS} from '../app/dict/constants';
import systemConfig from '../app/config/systemConfig';
import Message from '../messenger/interfaces/Message';
import {find, isEmpty, isObject, trim, values} from './lodashLike';


export const PATH_SEPARATOR = '/';


export function generateUniqId(): string {
  // TODO: почему не используется из helpers ???
  return uniqid();
}

// TODO: move to separate file
export function validateMessage(message: Message) {
  return message && message.category && message.topic && message.from && message.to;
}

export function withoutFirstItemUint8Arr(arr: Uint8Array): Uint8Array {

  // TODO: test

  const shift = 1;
  const result = new Uint8Array(arr.length - shift);

  for (let i = 0; i < arr.length; i++) {
    result[i] = arr[i + shift];
  }

  return result;
}

export function addFirstItemUint8Arr(arr: Uint8Array, itemToAdd: number): Uint8Array {

  // TODO: test

  const itemsToAdd = 1;
  const result = new Uint8Array(arr.length + itemsToAdd);
  result[0] = itemToAdd;
  arr.forEach((item, index) => result[index + itemsToAdd] = item);

  return result;
}


export function generateEventName(category: string, topic: string = ALL_TOPICS, ...others: Array<string>): string {

  // TODO: test

  return [ category, topic, ...others ].join(systemConfig.eventNameSeparator);
}

export function combineTopic(basePath: string, ...subPaths: Array<string>): string {

  // TODO: test

  if (isEmpty(subPaths)) return basePath;

  return [ basePath, ...subPaths ].join(systemConfig.topicSeparator);
}

export function splitTopic(topic: string): { id: string, subTopic: string } {

  // TODO: test

  const { first, rest } = splitFirstElement(topic, systemConfig.topicSeparator);

  return {
    id: first,
    subTopic: rest,
  };
}

export function splitFirstElement(
  fullPath: string,
  separator: string
): { first: string, rest: string } {

  // TODO: test

  if (!fullPath) throw new Error(`fullPath param is empty`);

  const split: string[] = fullPath.split(separator);
  const first: string = split[0];

  return {
    first,
    rest: split.slice(1).join(separator),
  };
}

export function splitLastElement(
  fullPath: string,
  separator: string
): { last: string, rest: string | undefined } {

  // TODO: review
  // TODO: test

  if (!fullPath) throw new Error(`fullPath param is empty`);

  const split = fullPath.split(separator);
  const last: string = split[split.length - 1];

  if (split.length === 1) {
    return {
      last: fullPath,
      rest: undefined,
    };
  }

  // remove last element from path
  split.pop();

  return {
    last,
    rest: split.join(separator),
  };
}

/**
 * It works with common structures like
 *     {
 *       parent: {
 *         prop: 'value'
 *       }
 *     }
 * @param rootObject
 * @param {function} cb - callback like (items, pathToItem) => {}.
 *                        If it returns false it means don't go deeper.
 */
export function findRecursively(rootObject: object, cb: (item: any, itemPath: string) => boolean) {

  // TODO: test, review

  const recursive = (obj: object, rootPath: string): object | undefined => {
    return find(obj, (item: any, name: string | number): any => {
      const itemPath = trim(`${rootPath}.${name}`, '.');
      const cbResult = cb(item, itemPath);

      if (typeof cbResult === 'undefined') {
        // go deeper
        return recursive(item, itemPath);
      }
      else if (cbResult === false) {
        // don't go deeper
        return;
      }
      else {
        // found - stop search
        //return cbResult;
        return true;
      }
    });
  };

  return recursive(rootObject, '');
}


export function callOnDifferentValues(
  arr1: any[],
  arr2: any[],
  cb: (index: number, value1: any, value2: any) => void
) {
  for (let indexStr in arr1) {
    const index: number = parseInt(indexStr);

    if (arr1[index] !== arr2[index]) {
      cb(index, arr1[index], arr2[index]);
    }
  }
}


export function convertToLevel(value: any): boolean {
  return value === '1' || value === 1
    || value === 'ON' || value === 'on' || value === 'On'
    || value === 'true' || value === true;
}

export function parseValue(rawValue: any): any {
  if (typeof rawValue === 'undefined') {
    return;
  }
  if (rawValue === null) {
    return null;
  }
  else if (typeof rawValue === 'boolean') {
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
  else if (rawValue === '') {
    return '';
  }
  // it is for - 2. strings
  else if (typeof rawValue === 'string' && rawValue.match(/^\d+\.$/)) {
    return rawValue;
  }

  const toNumber = Number(rawValue);

  if (!Number.isNaN(toNumber)) {
    // it's number
    return toNumber;
  }

  if (typeof rawValue === 'string') {
    return rawValue;
  }

  // array or object - as is
  return rawValue;
}

export function isDigitalInputInverted(invert: boolean, invertOnPullup: boolean, pullup?: boolean): boolean {
  // twice inverting on pullup if allowed
  if (pullup && invertOnPullup) {
    return !invert;
  }

  // in other cases - use invert prop
  return invert;
}

/**
 * E.g getKeyOfObject({key1: 'value1'}, 'value1') - then it returns 'key1'
 */
export function getKeyOfObject(obj: {[index: string]: any}, value: any): string | undefined {
  const valuesOfObj: any[] = values(obj);
  const keys: string[] = Object.keys(obj);
  const valueIndex: number = valuesOfObj.indexOf(value);

  // if -1 - din't find
  if (valueIndex < 0) return;

  return keys[valueIndex];
}

// TODO: move to nodeLike

export function isAbsolutePath(pathToDirOrFile: string): boolean {
  return Boolean(pathToDirOrFile.match(/^\//));
}

export function dirname(pathToDirOrFile: string): string {
  const pathParts: string[] = pathToDirOrFile.split(PATH_SEPARATOR);

  pathParts.pop();

  return pathParts.join(PATH_SEPARATOR);
}

export function basename(pathToDirOrFile: string): string {
  const pathParts: string[] = pathToDirOrFile.split(PATH_SEPARATOR);

  return pathParts[pathParts.length - 1];
}

/**
 * Deep merge two objects.
 * It mutates target object.
 * To not mutate first object use it this way `mergeDeep({}, defaultValues, newValues)`
 */
export function mergeDeep(target: {[index: string]: any}, ...sources: {[index: string]: any}[]): {[index: string]: any} {

  // TODO: test - проверить чтобы не мутировалось если передан первым параметр объект

  if (!sources.length) return target;

  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export function isUint8Array(value: any): boolean {
  if (typeof value === 'object') return false;

  return value.constructor === Uint8Array;
}

export function firstLetterToUpperCase(value: string): string {
  if (!value) return value;

  const split: string[] = value.split('');

  split[0] = split[0].toUpperCase();

  return split.join('');
}

export function updateArray(arrToUpdate: any[], newValues: any[]): void {
  for (let index in newValues) arrToUpdate[index] = newValues[index];
}

export function invertIfNeed(value: boolean, invert?: boolean): boolean {
  if (invert) return !value;

  return value;
}
