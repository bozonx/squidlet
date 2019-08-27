export function lastItem(arr: any[]): any {
  return arr[arr.length - 1];
}

export function arraysDifference(testArr: any[], samples: any[]): any[] {
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

/**
 * Like lodash's compact. It removes undefined, null and '' from array.
 * It make a new array.
 */
export function compactArray(arr: any[]): any[] {
  const result: any[] = [];

  for (let value of arr) {
    if (typeof value !== 'undefined' && value !== null && value !== '') {
      result.push(value);
    }
  }

  return result;
}

export function compactUndefined(arr: any[]): any[] {
  const result: any[] = [];

  for (let value of arr) {
    if (typeof value !== 'undefined') {
      result.push(value);
    }
  }

  return result;
}

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
 * Find index of array.
 * Cb has to return boolean of undefined. If true then it means that item is found.
 */
export function findIndexArray(arr: any[], cb: (item: any, index: number) => boolean | undefined): number {
  if (typeof arr === 'undefined') {
    return -1;
  }
  else if (!Array.isArray(arr)) {
    throw new Error(`findIndexArray: unsupported type of "arr" param "${JSON.stringify(arr)}"`);
  }

  for (let index in arr) {
    const indexNum: number = parseInt(index);
    const result: any | undefined = cb(arr[indexNum], indexNum);

    if (result === false || typeof result === 'undefined') continue;

    return indexNum;
  }

  return -1;
}


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
