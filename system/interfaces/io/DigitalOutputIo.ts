import IoItem from '../IoItem';
import {OutputResistorMode} from '../gpioTypes';


export type ChangeHandler = (level: boolean) => void;


export const Methods = [
  'setupOutput',
  'write',
  'clearPin',
  'clearAll',
];


export default interface DigitalIo extends IoItem {
  /**
   * Setup pin as an output
   * @param pin - pin number
   * @param initialValue - value which will be set on default. Be careful with inverting and pullup mode.
   * @param outputMode - one of modes: output | output_opendrain
   */
  setupOutput(pin: number, initialValue: boolean, outputMode: OutputResistorMode): Promise<void>;

  //getPinDirection(pin: number): Promise<PinDirection | undefined>;

  // output and input pins can be read
  read(pin: number): Promise<boolean>;

  /**
   * Writing is allowed only for output pins
   */
  write(pin: number, value: boolean): Promise<void>;

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
