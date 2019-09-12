import {isPlainObject} from './objects';


// export function values(obj: {[index: string]: any}): any[] {
//   return Object.keys(obj).map(key => obj[key]);
// }





// it works properly but very expensive because of using of JSON.stringify -> JSON.parse.
// !WARNING: undefined values which are obviously set in objects will be omitted
// !WARNING: undefined values in arrays will be converted to null
// WARNING!: expensive operation
export function cloneDeep(value: any): any {
  // not cloneable
  if (
    // TODO: don't use null
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
