import {find, isEqual, isObject, trim, values} from './lodashLike';


/**
 * Make a new Uint8Array without the first item
 */
export function withoutFirstItemUint8Arr(arr: Uint8Array): Uint8Array {
  if (!isUint8Array(arr)) {
    throw new Error(`collections.withoutFirstItemUint8Arr: array have to be an Uint8Array`);
  }

  const shift = 1;
  const result = new Uint8Array(arr.length - shift);

  for (let i = 0; i < arr.length; i++) {
    result[i] = arr[i + shift];
  }

  return result;
}

/**
 * Make a new Uint8Array with the new item on the first position and other items is moved right
 */
export function addFirstItemUint8Arr(arr: Uint8Array, itemToAdd: number): Uint8Array {
  if (!isUint8Array(arr)) {
    throw new Error(`collections.withoutFirstItemUint8Arr: array have to be an Uint8Array`);
  }

  const itemsToAdd = 1;
  const result = new Uint8Array(arr.length + itemsToAdd);
  result[0] = itemToAdd;
  arr.forEach((item, index) => result[index + itemsToAdd] = item);

  return result;
}


export function isUint8Array(value: any): boolean {
  if (typeof value !== 'object') return false;

  return value.constructor === Uint8Array;
}

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
 * Deep merge two objects.
 * It mutates target object.
 * To not mutate first object use it this way `mergeDeep({}, defaultValues, newValues)`
 */
export function mergeDeep(target: {[index: string]: any}, ...sources: {[index: string]: any}[]): {[index: string]: any} {

  // TODO: test - проверить чтобы не мутировалось если передан первым параметр объект
  // TODO: test - почему не defultsDeep ????

  if (!sources.length) return target;

  const source = sources.shift() as {[index: string]: any};

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
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
    return find(obj, (item: any, name: string | number): any => {
      const itemPath = trim(`${rootPath}.${name}`, '.');
      const cbResult = cb(item, itemPath);

      if (typeof cbResult === 'undefined') {
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

