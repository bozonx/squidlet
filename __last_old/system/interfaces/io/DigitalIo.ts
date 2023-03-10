import IoItem from '../IoItem';
import {Edge, InputResistorMode, OutputResistorMode, PinDirection} from '../gpioTypes';


export type ChangeHandler = (level: boolean) => void;


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

  /**
   * Get resistor pin mode.
   * To be sure about direction, please check it before.
   * Results might be:
   * * undefined - pin hasn't been set up
   * * 0 - resistor isn't used
   * * 1 - pullUp for inputs or openDrain for outputs
   * * 2 - pullDown for inputs
   */
  getPinResistorMode(pin: number): Promise<InputResistorMode | OutputResistorMode | undefined>;
  // output and input pins can be read
  read(pin: number): Promise<boolean>;

  /**
   * Writing is allowed only for output pins
   */
  write(pin: number, value: boolean): Promise<void>;

  /**
   * Listen of changes of input pins according to specified edge in setup.
   * It allows to add listener even pin hasn't been set up, but better to check it before add a listener.
   */
  onChange(pin: number, handler: ChangeHandler): Promise<number>;

  /**
   * Remove listener which has been added by "onChange" method.
   */
  removeListener(handlerIndex: number): Promise<void>;

  /**
   * Destroy pin and remove listeners of it.
   * After that pin is uncontrolled, if you want to control it again then set it up.
   */
  clearPin(pin: number): Promise<void>;

  /**
   * Destroy all the pins but not destroy Digital IO instance.
   */
  clearAll(): Promise<void>;
}
