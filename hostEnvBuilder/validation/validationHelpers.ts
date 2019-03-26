export function sequence(exprs: (() => string | undefined)[]): string | undefined {

}

export function required(value: any, paramName: string): string | undefined {
  if (typeof value === 'undefined') return `${paramName} is required`;

  return;
}

export function isString(value: any, paramName: string): string | undefined {
  if (typeof value !== 'string') return `${paramName} is not string`;

  return;
}
