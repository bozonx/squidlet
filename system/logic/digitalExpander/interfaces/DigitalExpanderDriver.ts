import {Edge, InputResistorMode, OutputResistorMode, PinDirection} from '../../../interfaces/gpioTypes';


export type DigitalExpanderDriverHandler = (
  pin: number,
  newState: {[index: string]: boolean}
) => void;

// export interface DigitalExpanderPinsProps {
//   direction: PinDirection;
//   resistor?: InputResistorMode | OutputResistorMode;
//   // for output pins
//   initialValue?: boolean;
//   // for input pin
//   debounce?: number;
//   // for input pin
//   edge?: Edge;
// }


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
   */
  setupInput(
    pin: number,
    resistor: InputResistorMode,
    debounce?: number,
    edge?: Edge
  ): Promise<void>;

  /**
   * Read input pins state
   */
  doPoll: () => Promise<void>;

  onChange(cb: DigitalExpanderDriverHandler): number;

  removeListener(handlerIndex: number): void;

  clearPin(pin: number): Promise<void>;
}
