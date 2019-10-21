import {ChangeHandler} from './io/DigitalIo';
import {Edge, InputResistorMode, OutputResistorMode, PinDirection} from './gpioTypes';


export interface GpioDigital {
  digitalSetupInput(pin: number, inputMode: InputResistorMode, debounce?: number, edge?: Edge): Promise<void>;
  digitalSetupOutput(pin: number, initialValue: boolean, outputMode: OutputResistorMode): Promise<void>;
  digitalGetPinDirection(pin: number): Promise<PinDirection | undefined>;
  digitalGetPinResistorMode(pin: number): Promise<InputResistorMode | OutputResistorMode | undefined>;
  digitalRead(pin: number): Promise<boolean>;
  // only for output pins
  digitalWrite(pin: number, level: boolean): Promise<void>;

  /**
   * Listen of changes of input pins according to specified edge in setup.
   * It allows to add listener even pin hasn't been set up, but better to check it before add a listener.
   */
  digitalOnChange(pin: number, handler: ChangeHandler): Promise<number>;
  digitalRemoveListener(handlerIndex: number): Promise<void>;
}

export default interface Gpio extends GpioDigital {
  // digital, analog, PWM, serial, i2c, etc
}
