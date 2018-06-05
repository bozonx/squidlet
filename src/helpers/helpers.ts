import * as _ from 'lodash';
import * as uniqid from 'uniqid';
import * as yaml from 'js-yaml';
import { TextEncoder, TextDecoder } from 'text-encoding';
import Destination from '../app/interfaces/Destination';

export const topicSeparator = '/';
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
  const recursive = (obj, rootPath) => _.find(obj, (item, name) => {
    const itemPath = _.trim(`${rootPath}.${name}`, '.');
    const cbResult = cb(item, itemPath);

    if (_.isUndefined(cbResult)) {
      // go deeper
      return recursive(item, itemPath);
    }
    else if (cbResult === false) {
      // don't go deeper
      return undefined;
    }
    else {
      // found - stop search
      return cbResult;
    }
  });

  return recursive(rootObject, '');
}

export function yamlToJs(yamlString: string): object {
  return yaml.safeLoad(yamlString);
}
