import {ChangeHandler, DigitalInputMode, DigitalOutputMode, DigitalPinMode, Edge} from './io/DigitalIo';


export interface GpioDigital {
  digitalSetupInput(pin: number, inputMode: DigitalInputMode, debounce: number, edge: Edge): Promise<void>;
  digitalSetupOutput(pin: number, initialValue: boolean, outputMode: DigitalOutputMode): Promise<void>;
  digitalRead(pin: number): Promise<boolean>;
  // only for output pins
  digitalWrite(pin: number, level: boolean): Promise<void>;
  digitalGetPinMode(pin: number): Promise<DigitalPinMode | undefined>;

  // only for input pins
  // Listen to change events
  digitalOnChange(pin: number, handler: ChangeHandler): Promise<number>;

  removeListener(handlerIndex: number): Promise<void>;
}

export default interface Gpio extends GpioDigital {
  // digital, analog, PWM, serial, i2c, etc
}
