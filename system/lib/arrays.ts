// TODO: remake to getLastItem
export function last(arr: any[]) {
  return arr[arr.length - 1];
}

// TODO: remake to arraysDifference
export function difference(testArr: any[], samples: any[]): any[] {
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

// TODO: remake to compactArray
export function compact(arr: any[]): any[] {
  const result: any[] = [];

  for (let value of arr) {
    if (typeof value !== 'undefined' && value !== null && value !== '') {
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

// TODO: test
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
