import {InputResistorMode, OutputResistorMode, PinDirection} from '../../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/gpioTypes.js';


// export enum DigitalExpanderEvents {
//   setup,
//   change,
//   incomeRawData,
// }

// export type DigitalExpanderDriverHandler = (newState: {[index: string]: boolean}) => void;
// export type DigitalExpanderPinInitHandler = (initializedPins: number[]) => void;

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
  wasPinInitialized(pin: number): boolean;
  getPinProps(pin: number): DigitalExpanderPinSetup | undefined;
}

export interface DigitalExpanderInputDriver {
  /**
   * Setup one or more pins. It can be called several times.
   * It will be wait for setup done forever.
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

  // TODO: не делать ни doPoll, onChange, removeListener, просто read

  /**
   * Read only input pins. Or return undefined if there isn't any new data.
   * It can return not changed pins too.
   * It is called at feedback logic.
   * But it mustn't be called if almost one input pin has been fully set up.
   */
  readInputPins(): Promise<{[index: string]: boolean} | undefined>;

  // /**
  //  * Read input pins state.
  //  * It has to use QueueOverride to not do unnecessary requests.
  //  */
  // doPoll: () => Promise<void>;
  //
  // onChange(cb: DigitalExpanderDriverHandler): number;
  //
  // removeListener(handlerIndex: number): void;

  clearPin(pin: number): Promise<void>;
  getAllPinsProps(): {[index: string]: DigitalExpanderPinSetup};
}
