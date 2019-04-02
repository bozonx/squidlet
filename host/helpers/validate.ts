import SchemaElement from '../interfaces/SchemaElement';
import {ParsedType, parseType} from './typesHelpers';
import {difference} from './lodashLike';


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

export function validateProps (
  props: {[index: string]: any},
  schema?: {[index: string]: SchemaElement}
): string | undefined {
  if (!schema) return;

  const whiteListErr: string | undefined = whiteList(props, Object.keys(schema), 'props');

  if (whiteListErr) return whiteListErr;

  for (let name of Object.keys(props)) {
    const typeErr: string | undefined = isValueOfType(schema[name].type, props[name]);

    if (typeErr) return `prop "${name}": typeErr`;
  }

  return;
}

export function validateRequiredProps (
  props: {[index: string]: any},
  schema?: {[index: string]: SchemaElement}
): string | undefined {
  if (!schema) return;

  for (let name of Object.keys(schema)) {
    if (schema[name].required && typeof props[name] === 'undefined') {
      return `prop "${name}" is required`;
    }
  }

  return;
}

export function whiteList(obj: any | undefined, allowedValues: any[], paramName: string): string | undefined {
  if (typeof obj === 'undefined') return;
  else if (typeof obj !== 'object') return `${paramName} is not object!`;

  const diff: any[] = difference(Object.keys(obj), allowedValues);

  if (diff.length) {
    return `${paramName} has not allowed params ${JSON.stringify(diff)}`;
  }

  return;
}
