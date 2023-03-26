import PropElement from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/PropElement.js';
import {ParsedType, parseType} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/typesHelpers.js';
import {arraysDifference} from '../../../../squidlet-lib/src/arrays';


function isCorrectTypedArray(type: string, arr: any[]): boolean {
  if (!Array.isArray(arr)) return false;

  //const typeOfItems: string = type.replace(/\[]/, '');
  const lengthOfBraces = 2;
  const typeOfItems: string = type.slice(0, type.length - lengthOfBraces);

  // if one of item doesn't correspond to specified type - it isn't a expected typed array
  for (let item of arr) {
    if (typeof item !== typeOfItems) return false;
  }

  return true;
}


/**
 * Does specified value correspond to specified type
 */
export function isValueOfType(fullType: string, value: any): string | undefined {
  const parsedType: ParsedType = parseType(fullType);

  // check types
  for (let type of parsedType.types) {
    if (type.indexOf('[]') > -1) {
      const isCorrectArray: boolean = isCorrectTypedArray(type, value);

      // if it correspond to array type = it's ok
      if (isCorrectArray) return;
    }

    if (typeof value === type) return;
  }

  // check constants
  for (let constant of parsedType.constants) {
    if (value === constant) return;
  }

  return `value "${JSON.stringify(value)}" doesn't correspond to type "${fullType}"`;
}

/**
 * Validate value which corresponds to part of schema
 */
export function validateParam(schema: {[index: string]: any}, pathToParam: string, value: any): string | undefined {
  const itemSchema: PropElement | undefined = schema[pathToParam];

  if (!itemSchema) return `Can't find schema's param ${pathToParam}`;

  return isValueOfType(schema[pathToParam].type, value);
}

/**
 * Validate props using its schema
 */
export function validateProps (
  props: {[index: string]: any},
  schema?: {[index: string]: PropElement}
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
  schema?: {[index: string]: PropElement}
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

  const diff: any[] = arraysDifference(Object.keys(obj), allowedValues);

  if (diff.length) {
    return `${paramName} has forbidden params ${JSON.stringify(diff)}`;
  }

  return;
}
