import {ChangeHandler, Edge, InputResistorMode, OutputResistorMode} from './io/DigitalIo';


export interface GpioDigital {
  digitalSetupInput(pin: number, inputMode: InputResistorMode, debounce: number, edge: Edge): Promise<void>;
  digitalSetupOutput(pin: number, initialValue: boolean, outputMode: OutputResistorMode): Promise<void>;
  // TODO: review
  digitalGetPinMode(pin: number): Promise<DigitalPinMode | undefined>;
  digitalRead(pin: number): Promise<boolean>;
  // only for output pins
  digitalWrite(pin: number, level: boolean): Promise<void>;
  // setup pin as input and return it's value. It useful for debug purpose
  digitalSetupAndRead(pin: number, inputMode?: InputResistorMode): Promise<boolean>;
  // setup pin as output and write the value. It useful for debug purpose
  digitalSetupAndWrite(pin: number, value: boolean, outputMode?: OutputResistorMode): Promise<void>;
  // only for input pins
  // Listen to change events
  digitalOnChange(pin: number, handler: ChangeHandler): Promise<number>;

  removeListener(handlerIndex: number): Promise<void>;
}

export default interface Gpio extends GpioDigital {
  // digital, analog, PWM, serial, i2c, etc
}
