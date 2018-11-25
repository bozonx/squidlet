export function resolveDriverName(specifiedName?: string): string {
  if (specifiedName) {
    return `Digital_${specifiedName}.driver`;
  }
  else {
    return 'Digital_local.driver';
  }
}


export function invertIfNeed(value: boolean, invert?: boolean): boolean {
  if (invert) return !value;

  return value;
}
