import {Edge, InputResistorMode, OutputResistorMode, PinDirection} from '../../../interfaces/gpioTypes';


export type DigitalExpanderDriverHandler = (newState: {[index: string]: boolean}) => void;

export interface DigitalExpanderPinsProps {
  direction: PinDirection;
  resistor?: InputResistorMode | OutputResistorMode;
  // for output pins
  initialValue?: boolean;
  // for input pin
  debounce?: number;
  // for input pin
  edge?: Edge;
}


export default interface DigitalExpanderDriver {
  /**
   * Setup one or more pins. It can be called several times.
   */
  setup(pinsProps: {[index: string]: DigitalExpanderPinsProps}): Promise<void>;

  getPinProps(pin: number): DigitalExpanderPinsProps | undefined;

  /**
   * Write output pins state
   */
  writeState(state: {[index: string]: boolean}): Promise<void>;

  /**
   * Read input pins state
   */
  doPoll(): Promise<void>;

  onChange(cb: DigitalExpanderDriverHandler): number;

  removeListener(handlerIndex: number): void;

  clearPin(pin: number): Promise<void>;
}
