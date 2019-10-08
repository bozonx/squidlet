import {DigitalInputMode} from '../../../interfaces/io/DigitalIo';


export function generateSubDriverId(source: string, pin: number, address?: string) {
  if (!address) return [source, pin].join('');

  return [source, pin, address].join('');
}

export function makeDigitalSourceDriverName(source: string) {
  return `Digital_${source}`;
}

export function resolveInputPinMode(pullup?: boolean, pulldown?: boolean): DigitalInputMode {
  if (pullup) return 'input_pullup';
  else if (pulldown) return 'input_pulldown';
  else return 'input';
}
