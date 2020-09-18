export type EdgeString = 'rising' | 'falling' | 'both';
export type directionString = 'input' | 'output';


// TODO: remove
export enum PinDirection {
  input,
  output
}

export enum InputResistorMode {
  none,
  pullup,
  pulldown,
}
export enum OutputResistorMode {
  none,
  opendrain,
}
export enum Edge {
  rising,
  falling,
  both,
}
