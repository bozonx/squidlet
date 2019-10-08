export function generateSubDriverId(source: string, pin: number, address?: string) {
  if (!address) return [source, pin].join('');

  return [source, pin, address].join('');
}

export function combineDriverName(source: string) {
  return `Digital_${source}`;
}
