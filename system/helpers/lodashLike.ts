/**
 * When undefined, null, '', [] or {}.
 * 0 is not empty!
 * @param toCheck
 */
export function isEmpty(toCheck: any): boolean {
  if (typeof toCheck == 'undefined' || toCheck === null || toCheck === '') return true;
  else if (toCheck instanceof Array && !toCheck.length) return true;
  else if (typeof toCheck === 'object' && !Object.keys(toCheck).length) return true;

  return false;
}

export function values(obj: {[index: string]: any}): any[] {
  return Object.keys(obj).map(key => obj[key]);
}

export function omit(obj: {[index: string]: any} | undefined, ...propToExclude: string[]): {[index: string]: any} {
  if (!obj) return {};

  const result: {[index: string]: any} = {};

  for (let key of Object.keys(obj)) {
    if (propToExclude.indexOf(key) < 0) {
      result[key] = obj[key];
    }
  }

  return result;
}

export function pick(obj: {[index: string]: any} | undefined, ...propToPick: string[]): {[index: string]: any} {
  if (!obj) return {};

  const result: {[index: string]: any} = {};

  for (let key of propToPick) {
    result[key] = obj[key];
  }

  return result;
}

export function find(collection: any[] | {[index: string]: any}, cb: (item: any, index: string | number) => any): any | undefined {
  if (typeof collection === 'undefined') {
    return;
  }
  else if (Array.isArray(collection)) {
    for (let index in collection) {
      const result: any | undefined = cb(collection[index], parseInt(index));

      if (result) return collection[index];
    }
  }
  else if (typeof collection === 'object') {
    for (let key of Object.keys(collection)) {
      const result: any = cb(collection[key], key);

      if (result) return collection[key];
    }
  }
  else {
    throw new Error(`find: unsupported type of collection "${JSON.stringify(collection)}"`);
  }

  return;
}

// TODO: test
export function findIndex(collection: any[] | {[index: string]: any}, cb: (item: any, index: string | number) => any): number | string {
  if (typeof collection === 'undefined') {
    return -1;
  }
  else if (Array.isArray(collection)) {
    for (let index in collection) {
      const result: any | undefined = cb(collection[index], parseInt(index));

      if (result) return parseInt(index);
    }
  }
  else if (typeof collection === 'object') {
    for (let key of Object.keys(collection)) {
      const result: any = cb(collection[key], key);

      if (result) return key;
    }
  }
  else {
    throw new Error(`findIndex: unsupported type of collection "${JSON.stringify(collection)}"`);
  }

  return -1;
}

export function trimStart(src: string, char: string = ' '): string {
  if (typeof src !== 'string') return src;

  const regex = new RegExp(`^\\${char}*`);

  return src.replace(regex, '');
}

export function trimEnd(src: string, char: string = ' '): string {
  if (typeof src !== 'string') return src;

  const regex = new RegExp(`\\${char}*$`);

  return src.replace(regex, '');
}

export function trim(src: string, char: string = ' '): string {
  return trimEnd( trimStart(src, char), char);
}

export function padStart(srcString: string, length: number = 0, chars: string = ' ') {
  let result = '';
  const repeats = length - srcString.length;

  if (repeats <= 0) return srcString;

  for (let i = 0; i < repeats; i ++) result += chars;

  return `${result}${srcString}`;
}

export function last(arr: any[]) {
  return arr[arr.length - 1];
}
//
// export function uniq(arr: string[]): string[] {
//   // TODO: !!!!
// }

// TODO: better to not use it at all
export function isEqual(first: any, second: any): boolean {
  if (
    first === null
    || typeof first === 'string'
    || typeof first === 'number'
    || typeof first === 'undefined'
    || typeof first === 'function'
    || second === null
    || typeof second === 'string'
    || typeof second === 'number'
    || typeof second === 'undefined'
    || typeof second === 'function'
  ) {
    return first === second;
  }
  else if (typeof first !== 'undefined' && typeof second === 'undefined') {
    return false;
  }
  else if (typeof first === 'undefined' && typeof second !== 'undefined') {
    return false;
  }
  else if (first instanceof Uint8Array && second instanceof Uint8Array) {
    return first.toString() === second.toString();
  }

  // TODO: не будет учитываться undefined в объектах и array (переводятся в null)
  // TODO: слишком дорогая процедура
  // arrays and objects
  return JSON.stringify(first) === JSON.stringify(second);
}

export function isPlainObject(obj: any): boolean {
  return  typeof obj === 'object' // separate from primitives
    && obj !== null         // is obvious
    && obj.constructor === Object // separate instances (Array, DOM, ...)
    && Object.prototype.toString.call(obj) === '[object Object]'; // separate build-in like Math
}

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

export function objGet(obj: {[index: string]: any}, pathTo: string, defaultValue?: any): any {
  const recursive = (currentObj: {[index: string]: any}, currentPath: string): any => {
    for (let itemName of Object.keys(currentObj)) {
      const pathOfItem: string = compact([currentPath, itemName]).join('.');

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

export function compact(arr: any[]): any[] {
  const result: any[] = [];

  for (let value of arr) {
    if (typeof value !== 'undefined' && value !== null && value !== '') {
      result.push(value);
    }
  }

  return result;
}

// // it works properly but very expensive because of using of JSON.stringify -> JSON.parse.
// // !WARNING: undefined values which are obviously set in objects will be omitted
// // !WARNING: undefined values in arrays will be converted to null
// export function cloneDeep(value: any): any {
//   // not cloneable
//   if (
//     value === null
//     || typeof value === 'number'
//     || typeof value === 'undefined'
//     || typeof value === 'function'
//   ) {
//     return value;
//   }
//   if (typeof value === 'string') {
//     return '' + value;
//   }
//   else if (value instanceof Uint8Array) {
//     const oldArr: Uint8Array = value;
//     const newArr: Uint8Array = new Uint8Array(oldArr.length);
//
//     for (let index in oldArr) newArr[index] = value[index];
//
//     return newArr;
//   }
//   else if (isPlainObject(value) || Array.isArray(value)) {
//     // arrays or plain object. Don't support of class instances.
//     return JSON.parse(JSON.stringify(value));
//   }
//
//   throw new Error(`cloneDeep: unsupported type of value "${JSON.stringify(value)}"`);
// }


// /**
//  * Deep merge two objects.
//  * It mutates target object.
//  * To not mutate first object use it this way `defaultsDeep({}, defaultValues, newValues)`
//  */
// export function defaultsDeep(target: {[index: string]: any}, ...sources: {[index: string]: any}[]): {[index: string]: any} {
//   if (!sources.length) return target;
//
//   // get the first of sources and remove it from sources
//   const source: {[index: string]: any} | undefined = sources.shift() as {[index: string]: any};
//
//   if (!isPlainObject(target) || !isPlainObject(source)) return target;
//
//   for (const key of  Object.keys(source)) {
//     if (isPlainObject(source[key])) {
//       // go deeper
//       if (!target[key]) Object.assign(target, { [key]: {} });
//       defaultsDeep(target[key], source[key]);
//     }
//     else {
//       Object.assign(target, { [key]: source[key] });
//     }
//   }
//
//   return defaultsDeep(target, ...sources);
// }
