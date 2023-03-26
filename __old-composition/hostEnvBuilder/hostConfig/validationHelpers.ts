import * as path from 'path';


export function sequence(exprs: (() => string | undefined)[]): string | undefined {
  for (let exp of exprs) {
    const result: string | undefined = exp();

    if (typeof result !== 'undefined') return result;
  }

  return;
}

export function required(value: any | undefined, paramName: string): string | undefined {
  if (typeof value === 'undefined') return `${paramName} is required`;

  return;
}

export function isString(value: any | undefined, paramName: string): string | undefined {
  if (typeof value === 'undefined') return;
  else if (typeof value !== 'string') return `${paramName} is not string`;

  return;
}

export function isNumber(value: any | undefined, paramName: string): string | undefined {
  if (typeof value === 'undefined') return;
  else if (typeof value !== 'number') return `${paramName} is not number`;

  return;
}

export function isBoolean(value: any | undefined, paramName: string): string | undefined {
  if (typeof value === 'undefined') return;
  else if (typeof value !== 'boolean') return `${paramName} is not boolean`;

  return;
}

export function isObject(value: any | undefined, paramName: string): string | undefined {
  if (typeof value === 'undefined') return;
  else if (typeof value !== 'object' || Array.isArray(value)) return `${paramName} is not object`;

  return;
}

export function isStringArray(value: any | undefined, paramName: string): string | undefined {
  if (typeof value === 'undefined') return;
  else if (!Array.isArray(value)) return `${paramName} is not a string array`;

  for (let item of value) {
    if (typeof item !== 'string') return `${paramName} has to be string array, but it contains not only strings`;
  }

  return;
}

export function oneOf(value: any | undefined, allowedValues: any[], paramName: string): string | undefined {
  if (typeof value === 'undefined') return;
  else if (!allowedValues.includes(value)) return `${paramName} is not one of ${JSON.stringify(allowedValues)}`;

  return;
}

/**
 * Not absolute and doesn't contains "../"
 */
export function isLocalPath(pathTo: string | undefined, paramName: string): string | undefined {
  if (typeof pathTo === 'undefined') return;

  if (path.isAbsolute(pathTo)) {
    return `path "${pathTo}" of "${paramName}" param is absolute but has to be local`;
  }
  else if (pathTo.match(/\.\./)) {
    return `path "${pathTo}" of "${paramName}" param has "..", it isn't allowed`;
  }

  return;
}
