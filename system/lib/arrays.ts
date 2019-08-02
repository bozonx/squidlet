// TODO: test
export function compactUndefined(arr: any[]): any[] {
  const result: any[] = [];

  for (let value of arr) {
    if (typeof value !== 'undefined') {
      result.push(value);
    }
  }

  return result;
}
