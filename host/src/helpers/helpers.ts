const _isEmpty = require('lodash/isEmpty');
const _find = require('lodash/find');
const _trim = require('lodash/trim');
import { TextEncoder, TextDecoder } from 'text-encoding';
import * as uniqid from 'uniqid';

import {ALL_TOPICS} from '../app/dict/constants';
import systemConfig from '../app/config/systemConfig';
import Message from '../messenger/interfaces/Message';


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

/**
 * Convert hex like "ffff" to array of bytes [ 255, 255 ]
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length < 2) throw new Error(`Incorrect length of hex data`);
  if (hex.length / 2 !== Math.ceil(hex.length / 2)) {
    throw new Error(`Incorrect length of hex data. It has to be even`);
  }

  const result: Uint8Array = new Uint8Array(hex.length / 2);

  for(let i = 0; i < hex.length; i += 2) {
    const byte = hex[i] + hex[i + 1];
    result[i / 2] = parseInt(byte, 16);
  }

  return result;
}

export function bytesToHexString(bytesArr: Uint8Array): string {
  let result = '';

  bytesArr.forEach((byte: number) => {
    result += hexNumToHexString(Number(byte));
  });

  return result;
}

export function hexToBinArr(hexValue: number): boolean[] {

  // TODO: test

  // convert 255 to "11111111"
  const binStr: string = hexValue.toString(2);
  // like ["1", "1", "1", "1", "1", "1", "1", "1"]
  const binSplitStr: string[] = binStr.split('');
  const result: boolean[] = new Array(8);

  for (let itemStr of binSplitStr) {
    result.push( Boolean( parseInt(itemStr) ) );
  }

  return result;
}

/**
 * Update specific position in bitmask.
 * E.g updateBitInByte(0, 2, true) ===> 4 (00000100)
 * @param byte
 * @param position
 * @param value
 */
export function updateBitInByte(byte: number, position: number, value: boolean): number {

  // TODO: test

  if (value) {
    // set the bit
    return byte | 1 << position;
  }
  else {
    // clear the bit
    return byte & ~(1 << position);
  }
}


export function generateEventName(category: string, topic: string = ALL_TOPICS, ...others: Array<string>): string {

  // TODO: test

  return [ category, topic, ...others ].join(systemConfig.eventNameSeparator);
}

export function combineTopic(basePath: string, ...subPaths: Array<string>): string {

  // TODO: test

  if (_isEmpty(subPaths)) return basePath;

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

export function uint8ArrayToText(arr: Uint8Array): string {
  return new TextDecoder('utf-8').decode(arr);
}

export function textToUint8Array(str: string): Uint8Array {
  return new TextEncoder('utf-8').encode(str);
}

export function hexStringToHexNum(hesString: string): number {
  // to hex. eg - "5A" -> 90. "5a" the same
  return parseInt(hesString, 16);
}

export function hexNumToHexString(hexNum: number): string {
  // e.g 65535 => "ffff". To decode use - parseInt("ffff", 16)
  let hexString: string = hexNum.toString(16);
  if (hexString.length === 1) hexString = '0' + hexString;

  return hexString;
}

export function numToWord(num: number): string {
  let result: string = hexNumToHexString(num);
  if (result.length === 2) result = '00' + result;

  return result;
}

export function wordToNum(word: string): number {
  return parseInt(word, 16);
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
    return _find(obj, (item: any, name: string): any => {
      const itemPath = _trim(`${rootPath}.${name}`, '.');
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
