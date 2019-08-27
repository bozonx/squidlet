import {isEqual, values} from './lodashLike';
import {compactArray} from './arrays';


/**
 * Check is object is empty.
 * For other types it will return true.
 */
export function isEmptyObject(toCheck?: {[index: string]: any}): boolean {
  if (Array.isArray(toCheck) || toCheck === null) return true;
  else if (typeof toCheck === 'object') return !Object.keys(toCheck).length;

  return true;
}

export function omitObj(obj: {[index: string]: any} | undefined, ...propToExclude: string[]): {[index: string]: any} {
  if (!obj) return {};

  const result: {[index: string]: any} = {};

  for (let key of Object.keys(obj)) {
    if (propToExclude.indexOf(key) < 0) {
      result[key] = obj[key];
    }
  }

  return result;
}

export function pickObj(obj: {[index: string]: any} | undefined, ...propToPick: string[]): {[index: string]: any} {
  if (!obj) return {};

  const result: {[index: string]: any} = {};

  for (let key of propToPick) {
    result[key] = obj[key];
  }

  return result;
}

/**
 * Find element in object. Like lodash's find function.
 */
export function findObj(obj: {[index: string]: any}, cb: (item: any, index: string | number) => any): boolean | undefined {
  if (typeof obj === 'undefined') {
    return;
  }
  else if (typeof obj !== 'object') {
    throw new Error(`findObj: unsupported type of object "${JSON.stringify(obj)}"`);
  }

  for (let key of Object.keys(obj)) {
    const result: any = cb(obj[key], key);

    if (result === false || typeof result === 'undefined') continue;

    return obj[key];
  }

  return;
}

export function isPlainObject(obj: any): boolean {
  return  typeof obj === 'object' // separate from primitives
    && obj !== null         // is obvious
    && obj.constructor === Object // separate instances (Array, DOM, ...)
    && Object.prototype.toString.call(obj) === '[object Object]'; // separate build-in like Math
}

export function objGet(obj: {[index: string]: any}, pathTo: string, defaultValue?: any): any {
  const recursive = (currentObj: {[index: string]: any}, currentPath: string): any => {
    for (let itemName of Object.keys(currentObj)) {
      const pathOfItem: string = compactArray([currentPath, itemName]).join('.');

      if (pathOfItem === pathTo) return currentObj[itemName];

      if (isPlainObject(currentObj[itemName])) {
        return recursive(currentObj[itemName], pathOfItem);
      }
    }
  };

  const result = recursive(obj, '');

  if (typeof result === 'undefined' && typeof defaultValue !== 'undefined') return defaultValue;

  return result;
}


/**
 * Get key by value
 * E.g getKeyOfObject({key1: 'value1'}, 'value1') - then it returns 'key1'
 */
export function getKeyOfObject(obj: {[index: string]: any}, value: any): string | undefined {
  if (!isExactlyObject(obj)) {
    throw new Error(`collection.getKeyOfObject: obj param has to be an object!`);
  }

  const valuesOfObj: any[] = values(obj);
  const keys: string[] = Object.keys(obj);
  const valueIndex: number = valuesOfObj.indexOf(value);

  // if -1 - didn't find
  if (valueIndex < 0) return;

  return keys[valueIndex];
}

/**
 * Compare 2 objects and collect keys whose VALUES are different (not equals to the same key in the sourceObj).
 * PartialObj can omit some props of sourceObj
 * getDifferentKeys({a:1, b:1, c:1}, {a:1, b:2}) => ['b']
 */
export function getDifferentKeys(sourceObj?: {[index: string]: any}, partialObj?: {[index: string]: any}): string[] {
  if (!partialObj) {
    return [];
  }
  else if (!sourceObj) {
    return Object.keys(partialObj);
  }

  const diffKeys: string[] = [];

  for (let key of Object.keys(sourceObj)) {
    // TODO: isEqual не правильно отрабоатает с параметрами с undefined
    // TODO: желательно не делать глубокого сравнения
    // TODO: может использовать конструкцию - key in obj
    if (typeof partialObj[key] !== 'undefined' && !isEqual(sourceObj[key], partialObj[key])) {
      diffKeys.push(key);
    }
  }

  return diffKeys;
}

/**
 * Is an object (plain or instance of some class), not an array
 */
export function isExactlyObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item) || false;
}

/**
 * Clear all the props in object
 */
export function clearObject(obj: {[index: string]: any}) {
  for (let name of Object.keys(obj)) delete obj[name];
}

/**
 * Merges two objects deeply.
 * It doesn't mutate any object.
 * If you obviously set undefined to one of top's param - it will keep its undefined value
 */
export function mergeDeepObjects(
  top: {[index: string]: any} | undefined,
  bottom: {[index: string]: any} | undefined
): {[index: string]: any} {
  if (typeof top === 'undefined') return bottom || {};
  if (typeof bottom === 'undefined') return top;

  const result: {[index: string]: any} = { ...top };

  for (let key of Object.keys(bottom)) {
    if (!(key in result)) {
      // set value which is absent on top
      result[key] = bottom[key];
    }
    // go deeper if bottom and top are objects
    else if (isPlainObject(result[key]) && isPlainObject(bottom[key])) {
      result[key] = mergeDeepObjects(result[key], bottom[key]);
    }
    // else - skip
  }

  return result;
}


// export function isEmpty(toCheck: any): boolean {
//   if (typeof toCheck == 'undefined' || toCheck === null || toCheck === '') return true;
//   else if (Array.isArray(toCheck) && !toCheck.length) return true;
//   else if (typeof toCheck === 'object' && !Object.keys(toCheck).length) return true;
//
//   return false;
// }

// export function findIndexj(collection: any[] | {[index: string]: any}, cb: (item: any, index: string | number) => any): number | string {
//   if (typeof collection === 'undefined') {
//     return -1;
//   }
//   else if (Array.isArray(collection)) {
//     for (let index in collection) {
//       const result: any | undefined = cb(collection[index], parseInt(index));
//
//       if (result) return parseInt(index);
//     }
//   }
//   else if (typeof collection === 'object') {
//     for (let key of Object.keys(collection)) {
//       const result: any = cb(collection[key], key);
//
//       if (result) return key;
//     }
//   }
//   else {
//     throw new Error(`findIndexObj: unsupported type of collection "${JSON.stringify(collection)}"`);
//   }
//
//   return -1;
// }

// /**
//  * It works with common structures like
//  *     {
//  *       parent: {
//  *         prop: 'value'
//  *       }
//  *     }
//  * @param rootObject
//  * @param {function} cb - callback like (items, pathToItem) => {}.
//  *                        If it returns false it means don't go deeper.
//  */
// export function findRecursively(rootObject: object, cb: (item: any, itemPath: string) => boolean) {
//   const recursive = (obj: object, rootPath: string): object | undefined => {
//     return find(obj, (item: any, name: string | number): any => {
//       const itemPath = trim(`${rootPath}.${name}`, '.');
//       const cbResult = cb(item, itemPath);
//
//       if (typeof cbResult === 'undefined') {
//         // go deeper
//         return recursive(item, itemPath);
//       }
//       else if (cbResult === false) {
//         // don't go deeper
//         return;
//       }
//       else {
//         // found - stop search
//         //return cbResult;
//         return true;
//       }
//     });
//   };
//
//   return recursive(rootObject, '');
// }
//
