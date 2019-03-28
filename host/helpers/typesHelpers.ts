import {trim} from './lodashLike';
import SchemaElement from '../interfaces/SchemaElement';


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

export function isValueOfType(type: string, value: any): string | undefined {
  const parsedType: ParsedType = parseType(type);

}

export function validateParam(schema: {[index: string]: any}, pathToParam: string, value: any): string | undefined {
  const itemSchema: SchemaElement | undefined = schema[pathToParam];

  if (!itemSchema) return `Can't find schema param ${pathToParam}`;

  return isValueOfType(schema[pathToParam].type, value);
}

export function validateDict(schema: {[index: string]: any}, dict: {[index: string]: any}): string | undefined {
  return;

  // TODO: !!!!
}
