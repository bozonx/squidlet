import * as _ from 'lodash';
import * as uniqid from 'uniqid';
import AddressInterface from '../app/interfaces/AddressInterface';


export function generateUniqId(): string {
  return uniqid();
}

export function generateTunnelId(connection: AddressInterface): string {
  return `${connection.hostId}-${connection.type}-${connection.bus}-${connection.address}`;
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
