import * as _ from 'lodash';
import * as uniqid from 'uniqid';
import * as yaml from 'js-yaml';
import { TextEncoder, TextDecoder } from 'text-encoding';


export const topicSeparator = '/';
// delimiter between host id and local device id like "path/to/host$path/to/device"
export const deviceIdSeparator = '$';

export function combineTopic(basePath: string, ...subPaths: Array<string>): string {
  if (_.isEmpty(subPaths)) return basePath;

  return [ basePath, ...subPaths ].join(topicSeparator);
}

export function parseDeviceId(deviceId: string): { hostId: string, deviceLocalId: string } {
  const [ hostId, deviceLocalId ] = deviceId.split(deviceIdSeparator);

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
  }
}

export function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder('utf-8').decode(arr);
}

export function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder('utf-8').encode(str);
}

export function stringToHex(addr: string): number {
  // to hex. eg - "5A" -> 90. "5a" the same
  return parseInt(addr, 16);
}

export function generateUniqId(): string {
  return uniqid();
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
    return _.find(obj, (item: any, name: string): any => {
      const itemPath = _.trim(`${rootPath}.${name}`, '.');
      const cbResult = cb(item, itemPath);

      if (_.isUndefined(cbResult)) {
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

export function yamlToJs(yamlString: string): any {
  return yaml.safeLoad(yamlString);
}
