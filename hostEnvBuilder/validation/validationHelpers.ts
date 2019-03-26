
export function sequence(exprs: (() => string | undefined)[]): string | undefined {
  // TODO: make
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
