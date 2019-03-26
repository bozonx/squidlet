import _difference = require('lodash/difference');


export function sequence(exprs: (() => string | undefined)[]): string | undefined {
  for (let exp of exprs) {
    const result: string | undefined = exp();

    if (typeof result !== 'undefined') return result;
  }

  return;
}

export function required(value: any, paramName: string): string | undefined {
  if (typeof value === 'undefined') return `${paramName} is required`;

  return;
}

export function isString(value: any, paramName: string): string | undefined {
  if (typeof value === 'undefined') return;
  else if (typeof value !== 'string') return `${paramName} is not string`;

  return;
}

export function isNumber(value: any, paramName: string): string | undefined {
  if (typeof value === 'undefined') return;
  else if (typeof value !== 'number') return `${paramName} is not number`;

  return;
}

export function isObject(value: any, paramName: string): string | undefined {
  if (typeof value === 'undefined') return;
  else if (typeof value !== 'object') return `${paramName} is not object`;

  return;
}

export function isStringArray(value: any, paramName: string): string | undefined {
  if (typeof value === 'undefined') return;
  else if (!Array.isArray(value)) return `${paramName} is not a string array`;

  for (let item of value) {
    if (typeof item !== 'string') return `${paramName} has to be string array, but it contains not only strings`;
  }

  return;
}

export function oneOf(value: any, allowedValues: any[], paramName: string): string | undefined {
  if (typeof value === 'undefined') return;
  else if (!allowedValues.includes(value)) return `${paramName} is not one of ${JSON.stringify(allowedValues)}`;

  return;
}

export function whiteList(obj: any, allowedValues: any[], paramName: string): string | undefined {
  if (typeof obj === 'undefined') return;
  else if (typeof obj !== 'object') return `${paramName} is not object!`;

  const diff: any[] = _difference(Object.keys(obj), allowedValues);

  if (diff.length) {
    return `${paramName} has not allowed params ${JSON.stringify(diff)}`;
  }

  return;
}
