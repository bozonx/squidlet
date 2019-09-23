/**
 * Are arrays equal.
 * If one of them not Array then it returns false.
 */
import {cloneDeepObject} from './objects';


export function lastItem(arr: any[]): any {
  // shift when you calculates length
  const ARRAY_INDEX_SHIFT = 1;

  return arr[arr.length - ARRAY_INDEX_SHIFT];
}

/**
 * Make a new array which contains items which are different in samples.
 * WARNING: be careful if samples has additional keys they won't be matched.
 */
export function arraysDifference(testArr: any[], samples: any[]): any[] {

  // TODO: странное поведение - смотрится только те ключи которых нет в samples
  //       но если в samples если лишние ключи - то они не учтутся

  if (typeof testArr === 'undefined' || !testArr.length) return [];
  else if (typeof samples === 'undefined' || !samples.length) return testArr;

  const diffArr: any[] = [];

  for (let item of testArr) {
    if (typeof item === 'undefined') continue;

    if (samples.indexOf(item) === -1) {
      diffArr.push(item);
    }
  }

  return diffArr;
}

// /**
//  * Compare two arrays and try to find values which are different in a both arrays.
//  * Undefined doesn't match.
//  */
// export function arraysFullDifference(arr1: any[], arr2: any[]): any[] {
//   if (typeof arr1 === 'undefined' || !arr1.length) return [...arr2];
//   else if (typeof arr2 === 'undefined' || !arr2.length) return [...arr1];
//
//   const diffArr: any[] = [];
//
//   for (let key in (arr1.length > arr2.length) ? arr1 : arr2) {
//     if (typeof item === 'undefined') continue;
//
//     if (arr1[key] !== arr2[key]) {
//       diffArr.push(item);
//     }
//   }
//
//   return diffArr;
// }

// TODO: лучше не использовать
// TODO: use filter
/**
 * Like lodash's compact. It removes undefined, null and '' from array.
 * It make a new array.
 */
export function compactArray(arr: any[]): any[] {
  const result: any[] = [];

  for (let value of arr) {
    // TODO: don't use null
    if (typeof value !== 'undefined' && value !== null && value !== '') {
      result.push(value);
    }
  }

  return result;
}

export function compactUndefined(arr: any[]): any[] {
  return arr.filter((item) => typeof item !== 'undefined');
}

export function clearArray(arr: any[]): void {
  arr.splice(0, arr.length);
}

// TODO: неиспользуется почти - лучше убрать
/**
 * Make new array with specified dimension.
 * If arr smaller than "count" then odd items will be empty
 * If arr bigger than "count" then odd items will be omitted
 */
export function setArrayDimension(arr: any[], count: number): any[] {
  const result: any[] = new Array(count);

  for (let i = 0; i < count; i++) result[i] = arr[i];

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

/**
 * Concat arrays and remove duplicates
 */
export function concatUniqStrArrays(...arrays: string[][]): string[] {
  const result: {[index: string]: true} = {};

  for (let arr of arrays) {
    for (let value of arr) {
      result[value] = true;
    }
  }

  return Object.keys(result);
}

export function cloneDeepArray(arr?: any[]): any[] {
  if (!arr) return [];

  const result: any[] = [];

  for (let item of arr) {
    if (Array.isArray(item)) {
      // go deeper
      result.push(cloneDeepArray(item));
    }
    else if (typeof item === 'object') {
      // clone object
      result.push(cloneDeepObject(item));
    }
    else {
      result.push(item);
    }
  }

  return result;
}

// /**
//  * Find index of array.
//  * Cb has to return boolean of undefined. If true then it means that item is found.
//  */
// export function findIndexArray(arr: any[], cb: (item: any, index: number) => boolean | undefined): number {
//   if (typeof arr === 'undefined') {
//     return -1;
//   }
//   else if (!Array.isArray(arr)) {
//     throw new Error(`findIndexArray: unsupported type of "arr" param "${JSON.stringify(arr)}"`);
//   }
//
//   for (let index in arr) {
//     const indexNum: number = parseInt(index);
//     const result: any | undefined = cb(arr[indexNum], indexNum);
//
//     if (result === false || typeof result === 'undefined') continue;
//
//     return indexNum;
//   }
//
//   return -1;
// }

// export function find(collection: any[] | {[index: string]: any}, cb: (item: any, index: string | number) => any): any | undefined {
//   if (typeof collection === 'undefined') {
//     return;
//   }
//   else if (Array.isArray(collection)) {
//     for (let index in collection) {
//       const result: any | undefined = cb(collection[index], parseInt(index));
//
//       if (result) return collection[index];
//     }
//   }
//   else if (typeof collection === 'object') {
//     for (let key of Object.keys(collection)) {
//       const result: any = cb(collection[key], key);
//
//       if (result) return collection[key];
//     }
//   }
//   else {
//     throw new Error(`find: unsupported type of collection "${JSON.stringify(collection)}"`);
//   }
//
//   return;
// }
