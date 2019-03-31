import {trim} from './lodashLike';
import SchemaElement from '../interfaces/SchemaElement';


export interface ParsedType {
  types: string[];
  constants: (string | number | boolean | null | undefined)[];
}


const basicTypes: string[] = [
  'string',
  'string[]',
  'number',
  'number[]',
  'boolean',
  'boolean[]',
];


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

export function isValueOfType(fullType: string, value: any): string | undefined {
  const parsedType: ParsedType = parseType(fullType);

  // check types
  for (let type of parsedType.types) {
    if (typeof value === type) return;
  }

  // check constants
  for (let constant of parsedType.constants) {
    if (value === constant) return;
  }

  return `value "${JSON.stringify(value)}" doesn't correspond to type "${fullType}"`;
}

export function validateParam(schema: {[index: string]: any}, pathToParam: string, value: any): string | undefined {
  const itemSchema: SchemaElement | undefined = schema[pathToParam];

  if (!itemSchema) return `Can't find schema's param ${pathToParam}`;

  return isValueOfType(schema[pathToParam].type, value);
}
