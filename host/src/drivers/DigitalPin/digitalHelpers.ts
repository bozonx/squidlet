export function resolveDriverName(specifiedName?: string): string {
  if (specifiedName) {
    return `Digital_${specifiedName}.driver`;
  }
  else {
    return 'Digital_local.driver';
  }
}
