export function resolveDriverName(specifiedName?: string): string {
  if (specifiedName) {
    return `Digital_${specifiedName}`;
  }
  else {
    return 'Digital_local';
  }
}
