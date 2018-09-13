const _isEmpty = require('lodash/isEmpty');
const _find = require('lodash/find');
const _trim = require('lodash/trim');
import { TextEncoder, TextDecoder } from 'text-encoding';

import systemConfig from '../app/config/systemConfig';
import Message from '../messenger/interfaces/Message';


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

export function generateEventName(category: string, topic: string, ...others: Array<string>): string {
  if (!topic || topic === '*') return [ category, ...others ].join(systemConfig.eventNameSeparator);

  return [ category, topic, ...others ].join(systemConfig.eventNameSeparator);
}

export function combineTopic(basePath: string, ...subPaths: Array<string>): string {
  if (_isEmpty(subPaths)) return basePath;

  return [ basePath, ...subPaths ].join(systemConfig.topicSeparator);
}

export function parseDeviceId(deviceId: string): { hostId: string, deviceLocalId: string } {
  const [ hostId, deviceLocalId ] = deviceId.split(systemConfig.deviceHostSeparator);

  if (!hostId || !deviceLocalId) {
    throw new Error(`Can't parse deviceId "${deviceId}"`);
  }

  return {
    hostId,
    deviceLocalId,
  };
}

export function splitLastElement(
  fullPath: string,
  separator: string
): { last: string, rest: string | undefined } {

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
