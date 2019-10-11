import {ChangeHandler, DigitalInputMode, DigitalOutputMode, DigitalPinMode, Edge} from './io/DigitalIo';


export default interface Gpio {
  digitalSetupInput(pin: number, inputMode: DigitalInputMode, debounce: number, edge: Edge): Promise<void>;
  digitalSetupOutput(pin: number, outputMode: DigitalOutputMode, initialValue: boolean): Promise<void>;
  digitalRead(pin: number): Promise<boolean>;
  // only for output pins
  digitalWrite(pin: number, value: boolean): Promise<void>;
  digitalGetPinMode(pin: number): Promise<DigitalPinMode | undefined>;

  // only for input pins
  // Listen to change events
  digitalAddListener(pin: number, handler: ChangeHandler): Promise<number>;

  removeListener(handlerIndex: number): Promise<void>;
}
