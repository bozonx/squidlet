import * as _ from 'lodash';
import * as uniqid from 'uniqid';
import { TextEncoder, TextDecoder } from 'text-encoding';
import AddressInterface from '../app/interfaces/AddressInterface';


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

export function generateTunnelId(connection: AddressInterface): string {
  const items = _.concat([
    connection.hostId,
    connection.type,
    connection.bus,
    connection.address,
  ]);

  return items.join('-');
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
