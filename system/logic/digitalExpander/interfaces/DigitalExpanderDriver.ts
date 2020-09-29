import {InputResistorMode, OutputResistorMode, PinDirection} from '../../../interfaces/gpioTypes';


export enum DigitalExpanderEvents {
  setup,
  change,
  incomeRawData,
}

export type DigitalExpanderDriverHandler = (newState: {[index: string]: boolean}) => void;
export type DigitalExpanderPinInitHandler = (initializedPins: number[]) => void;

export interface DigitalExpanderPinSetup {
  direction: PinDirection;
  resistor?: InputResistorMode | OutputResistorMode;
  // for output pins
  initialValue?: boolean;
  // for input pin which will be handled at microcontroller side
  debounce?: number;
}


export interface DigitalExpanderOutputDriver {
  /**
   * Setup one or more pins. It can be called several times.
   */
  setupOutput(
    pin: number,
    resistor?: OutputResistorMode,
    initialValue?: boolean
  ): Promise<void>;

  /**
   * Write output pins state
   */
  writeState(state: {[index: string]: boolean}): Promise<void>;

  clearPin(pin: number): Promise<void>;
}

export interface DigitalExpanderInputDriver {
  /**
   * Setup one or more pins. It can be called several times.
   * It isn't possible to handle Edge at microcontroller side because of interface which
   * is used. Edge is processing at local side.
   * If debounce exists on microcontroller side then define some number.
   * If doesn't exist or there no need to use debounce then don't define it or set to undefined.
   */
  setupInput(
    pin: number,
    resistor: InputResistorMode,
    debounce: number,
  ): Promise<void>;

  /**
   * Read input pins state
   */
  doPoll: () => Promise<void>;

  onChange(cb: DigitalExpanderDriverHandler): number;

  removeListener(handlerIndex: number): void;

  clearPin(pin: number): Promise<void>;
}
