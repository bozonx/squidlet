import {isEqual, isPlainObject, values} from './lodashLike';


/**
 * Concat arrays but not create a new one.
 * It mutates the srcArr.
 */
export function appendArray<T>(srcArr: T[], arrToAppend?: T[]) {
  if (!arrToAppend) return;

  for (let item of arrToAppend) srcArr.push(item);
}

/**
 * Replace values if array.
 * It mutates an "arrToUpdate" array.
 */
export function updateArray(arrToUpdate: any[], newValues: any[]): void {
  for (let index in newValues) arrToUpdate[index] = newValues[index];
}

/**
 * Make new array with specified dimension.
 * If arr smaller than count then odd items will be empty
 * If arr bigger than count then odd items will be omitted
 */
export function setArrayDimension(arr: any[], count: number): any[] {
  const result: any[] = new Array(count);

  for (let i = 0; i < count; i++) result[i] = arr[i];

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

// TODO: test
export function concatUniqStrArrays(...arrays: string[][]): string[] {
  const result: {[index: string]: true} = {};

  for (let arr of arrays) {
    for (let value of arr) {
      result[value] = true;
    }
  }

  return Object.keys(result);
}

/**
 * Clear all the props in object
 */
export function clearObject(obj: {[index: string]: any}) {
  for (let name of Object.keys(obj)) delete obj[name];
}

/**
 * Is an object (plain or instance of some class), not an array
 */
export function isExactlyObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item) || false;
}

/**
 * Merges two objects deeply.
 * It doesn't mutate any object.
 * If you obviously set undefined to one of top's param - it will keep its undefined value
 */
export function mergeDeep(
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
      result[key] = mergeDeep(result[key], bottom[key]);
    }
    // else - skip
  }

  return result;
}

/**
 * Remove item from array. E.g removeItemFromArray(['a', 'b', 'c'], 'b') => ['a', 'c']
 * It can remove all the found items
 *     removeItemFromArray(['a', 'b', 'c', 'b'], 'b', false) => ['a', 'c']
 * Or remove only the first found item:
 *     removeItemFromArray(['a', 'b', 'c', 'b'], 'b') => ['a', 'c', 'b']
 * It doesn't mutates an array, it just returns a new one.
 */
export function removeItemFromArray(arr: any[] | undefined, item: any, firstEntry: boolean = true): any[] {
  if (!arr) return [];

  if (firstEntry) {
    const index: number = arr.indexOf(item);

    if (index < 0) return arr;

    const clonedArr = [...arr];

    clonedArr.splice(index, 1);

    return clonedArr;
  }
  else {
    return arr.filter((currentItem: any) => {
      return currentItem !== item;
    });
  }
}


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
