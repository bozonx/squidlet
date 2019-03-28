import {trim} from './lodashLike';


export interface ParsedType {
  types: string[];
  constants: string[];
}


const basicTypes: string[] = [
  'string',
  'string[]',
  'number',
  'number[]',
  'boolean',
  'boolean[]',
];

const constants: string[] = [
  'true',
  'false',
  'null',
  'undefined',
];


export function parseType(type: string | number | boolean | undefined): ParsedType {
  if (typeof type === 'undefined') throw new  Error(`Type is required`);
  if (
    (typeof type !== 'string' && typeof type !== 'number' && typeof type !== 'boolean')
    || type === ''
  ) {
    throw new Error(`type "${JSON.stringify(type)}" is not supported`);
  }

  const types: string[] = String(type).split('|').map((item) => trim(item));
  const result: ParsedType = {types: [], constants:[]};

  for (let item of types) {
    // numbers
    if (!Number.isNaN(Number(item))) result.constants.push(item);
    // constants
    else if (constants.includes(item)) result.constants.push(item);
    // string constants
    else if (item.match(/^['"][\w\d\s\-\_\$]+['"]$/)) result.constants.push(item);
    // basic types
    else if (basicTypes.includes(item)) {
      result.types.push(item);
    }
    else {
      throw new Error(`unsupported type "${item}" of "${type}"`;
    }
  }

  return result;
}
