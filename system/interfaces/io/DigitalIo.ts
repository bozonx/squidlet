import IoItem from '../IoItem';


export type ChangeHandler = (level: boolean) => void;
export enum PinDirection {
  input,
  output
}
// export type DigitalInputMode = 'input'
//   | 'input_pullup'
//   | 'input_pulldown';
// export type DigitalOutputMode = 'output'
//   | 'output_opendrain';
// export type DigitalPinMode = DigitalInputMode | DigitalOutputMode;
// export type Edge = 'rising' | 'falling' | 'both';
//

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

export const Methods = [
  'setupInput',
  'setupOutput',
  'read',
  'write',
  'getPinMode',
  'onChange',
  'removeListener',
  'removeAllListeners',
];


export default interface DigitalIo extends IoItem {
  /**
   * Setup pin as an input
   * @param pin - pin number
   * @param inputMode - one of modes: input | input_pullup | input_pulldown | output
   * @param debounce - debounce time in ms. 0 or less = no debounce.
   * @param edge - Which value (0 or 1 or both) will rise an event. One of modes: rising | falling | both
   */
  setupInput(pin: number, inputMode: InputResistorMode, debounce: number, edge: Edge): Promise<void>;

  /**
   * Setup pin as an output
   * @param pin - pin number
   * @param initialValue - value which will be set on default. Be careful with inverting and pullup mode.
   * @param outputMode - one of modes: output | output_opendrain
   */
  setupOutput(pin: number, initialValue: boolean, outputMode: OutputResistorMode): Promise<void>;

  getPinDirection(pin: number): Promise<PinDirection | undefined>;
  getPinResistorMode(pin: number): Promise<InputResistorMode | OutputResistorMode | undefined>;
  // output and input pins can be read
  read(pin: number): Promise<boolean>;
  // only for output pins
  write(pin: number, value: boolean): Promise<void>;

  /**
   * Listen of changes of input pins.
   * Pin has to be set up before and has to be an input.
   */
  onChange(pin: number, handler: ChangeHandler): Promise<number>;
  removeListener(handlerIndex: number): Promise<void>;

  /**
   * Remove listeners of the pin and destroy pin (unmanage) if need
   */
  clearPin(pin: number): Promise<void>;
  clearAll(): Promise<void>;
}
