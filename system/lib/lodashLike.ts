/**
 * When undefined, null, '', [] or {}.
 * 0 is not empty!
 * @param toCheck
 */
import {isPlainObject} from './objects';


// export function values(obj: {[index: string]: any}): any[] {
//   return Object.keys(obj).map(key => obj[key]);
// }

// TODO: remove - better to use String's method
export function trimStart(src: string, char: string = ' '): string {
  if (typeof src !== 'string') return src;

  const regex = new RegExp(`^\\${char}*`);

  return src.replace(regex, '');
}

// TODO: remove - better to use String's method
export function trimEnd(src: string, char: string = ' '): string {
  if (typeof src !== 'string') return src;

  const regex = new RegExp(`\\${char}*$`);

  return src.replace(regex, '');
}

// TODO: remove - better to use String's method
export function trim(src: string, char: string = ' '): string {
  return trimEnd( trimStart(src, char), char);
}

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

// it works properly but very expensive because of using of JSON.stringify -> JSON.parse.
// !WARNING: undefined values which are obviously set in objects will be omitted
// !WARNING: undefined values in arrays will be converted to null
// WARNING!: expensive operation
export function cloneDeep(value: any): any {
  // not cloneable
  if (
    value === null
    || typeof value === 'number'
    || typeof value === 'undefined'
    || typeof value === 'function'
  ) {
    return value;
  }
  if (typeof value === 'string') {
    return '' + value;
  }
  else if (value instanceof Uint8Array) {
    const oldArr: Uint8Array = value;
    const newArr: Uint8Array = new Uint8Array(oldArr.length);

    for (let index in oldArr) newArr[index] = value[index];

    return newArr;
  }
  else if (isPlainObject(value) || Array.isArray(value)) {
    // arrays or plain object. Don't support of class instances.
    return JSON.parse(JSON.stringify(value));
  }

  throw new Error(`cloneDeep: unsupported type of value "${JSON.stringify(value)}"`);
}


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
