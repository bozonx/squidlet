import {trim} from './lodashLike';


export interface ParsedType {
  types: string[];
  constants: (string | number | boolean | null | undefined)[];
}


export const basicTypes: string[] = [
  'string',
  'string[]',
  'number',
  'number[]',
  'boolean',
  'boolean[]',
  'object',
  'object[]',
];


/**
 * Read type and decide is it type or constant
 */
export function parseType(type: string | number | boolean | undefined): ParsedType {
  if (typeof type === 'undefined') throw new  Error(`Type is required`);
  else if (
    (typeof type !== 'string' && typeof type !== 'number' && typeof type !== 'boolean')
    || type === ''
  ) {
    throw new Error(`type "${JSON.stringify(type)}" is not supported`);
  }

  const types: string[] = String(type).split('|').map((item) => trim(item));
  const result: ParsedType = {types: [], constants:[]};

  for (let item of types) {
    // numbers
    if (!Number.isNaN(Number(item))) result.constants.push(Number(item));
    // constants
    //else if (constants.includes(item)) result.constants.push(item);
    else if (item === 'true') result.constants.push(true);
    else if (item === 'false') result.constants.push(false);
    else if (item === 'null') result.constants.push(null);
    else if (item === 'undefined') result.constants.push(undefined);
    // string constants
    else if (item.match(/^['"][\w\d\s\-\_\$]+['"]$/)) result.constants.push(
      item.replace(/\'|\"/g, '')
    );
    // basic types
    else if (basicTypes.includes(item)) {
      result.types.push(item);
    }
    else {
      throw new Error(`unsupported type "${item}" of "${type}"`);
    }
  }

  return result;
}
