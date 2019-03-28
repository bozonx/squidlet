//const _get = require('lodash/get');

import SchemaElement from '../interfaces/SchemaElement';
import {ParsedType, parseType} from './typesHelpers';


export function validateParam(schema: {[index: string]: any}, pathToParam: string, value: any): string | undefined {
  const itemSchema: SchemaElement | undefined = schema[pathToParam];

  if (!itemSchema) return `Can't find schema param ${pathToParam}`;

  const parsedType: ParsedType = parseType(schema[pathToParam].type);

  //
  // // если не указан тип - то это значение - тогда по значению можно взять тип
  //
  // return;
}

export function validateDict(schema: {[index: string]: any}, dict: {[index: string]: any}): string | undefined {
  return;

  // TODO: !!!!
}
