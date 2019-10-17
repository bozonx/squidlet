import {InputResistorMode, OutputResistorMode} from '../interfaces/io/DigitalIo';


// export function generateSubDriverId(source: string, pin: number, address?: string) {
//   if (!address) return [source, pin].join('');
//
//   return [source, pin, address].join('');
// }
//
// export function makeDigitalSourceDriverName(source: string) {
//   return `Digital_${source}`;
// }

export function resolveInputPinMode(pullup?: boolean, pulldown?: boolean): InputResistorMode {
  if (pullup) return InputResistorMode.pullup;
  else if (pulldown) return InputResistorMode.pulldown;

  return InputResistorMode.none;
}

export function resolveOutputPinMode(openDrain?: boolean): OutputResistorMode {
  if (openDrain) return OutputResistorMode.opendrain;

  return OutputResistorMode.none;
}
