import {cloneDeep, isEqual, isObject, isPlainObject, values} from './lodashLike';


/**
 * Concat arrays but not create a new one, it mutates the srcArr.
 */
export function appendArray<T>(srcArr: T[], arrToAppend?: T[]) {
  if (!arrToAppend) return;

  for (let item of arrToAppend) srcArr.push(item);
}

/**
 * Replace values if array. It mutates an "arrToUpdate" array.
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
  if (!isObject(obj)) {
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
export function getDifferentKeys(sourceObj: {[index: string]: any}, partialObj: {[index: string]: any}): string[] {
  const diffKeys: string[] = [];

  for (let key of Object.keys(sourceObj)) {
    if (typeof partialObj[key] !== 'undefined' && !isEqual(sourceObj[key], partialObj[key])) {
      diffKeys.push(key);
    }
  }

  return diffKeys;
}

/**
 * Clear all the props in object
 */
export function clearObject(obj: {[index: string]: any}) {

  // TODO: test

  for (let name of Object.keys(obj)) delete obj[name];
}

/**
 * Merges two objects deeply.
 * It doesn't mutate any object.
 */
export function mergeDeep(
  top: {[index: string]: any} | undefined,
  bottom: {[index: string]: any} | undefined
): {[index: string]: any} {
  if (typeof top === 'undefined') return bottom || {};
  if (typeof bottom === 'undefined') return top;

  const result: {[index: string]: any} = cloneDeep(top);

  for (let key of Object.keys(bottom)) {
    if (typeof result[key] === 'undefined') {
      // set value which is absent on top
      result[key] = bottom[key];
    }
    else if (isPlainObject(result[key]) && isPlainObject(bottom[key])) {
      result[key] = mergeDeep(result[key], bottom[key]);
    }
    // else - skip
  }

  return result;
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
//
//   // TODO: test, review
//
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
