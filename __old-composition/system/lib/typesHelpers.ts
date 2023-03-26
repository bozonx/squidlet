import {Primitives} from '../../../../squidlet-lib/src/interfaces/Types';
import {isKindOfNumber} from '../../../../squidlet-lib/src/common';


export interface ParsedType {
  types: string[];
  constants: (Primitives | undefined)[];
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
export function parseType(type?: Primitives): ParsedType {
  if (typeof type === 'undefined') throw new  Error(`Type is required`);
  else if (
    (typeof type !== 'string' && typeof type !== 'number' && typeof type !== 'boolean')
    || type === ''
  ) {
    throw new Error(`type "${JSON.stringify(type)}" is not supported`);
  }

  const types: string[] = String(type).split('|').map((item) => item.trim());
  const result: ParsedType = {types: [], constants:[]};

  for (let item of types) {
    // numbers
    if (isKindOfNumber(item)) result.constants.push(Number(item));
    // constants
    //else if (constants.includes(item)) result.constants.push(item);
    else if (item === 'true') result.constants.push(true);
    else if (item === 'false') result.constants.push(false);
    // TODO: don't use null???
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
