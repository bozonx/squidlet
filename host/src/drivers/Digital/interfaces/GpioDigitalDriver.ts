import {DriverBaseProps} from '../../../app/entities/DriverBase';

export type GpioDigitalDriverHandler = (level: boolean) => void;

export interface GpioDigitalDriverPinParams extends DriverBaseProps {
  direction: 'input' | 'output';
  // use pullup resistor. Only for input pin
  pullup?: boolean;
  // use pulldown resistor. Only for input pin
  pulldown?: boolean;
  // initial value for output pin
  initial?: boolean;
}


export default interface GpioDigitalDriver {
  setup(pin: number, params: GpioDigitalDriverPinParams): Promise<void>;
  getLevel(pin: number): Promise<boolean>;
  // only for output pin
  setLevel(pin: number, level: boolean): Promise<void>;
  // only for input pin
  addListener(handler: GpioDigitalDriverHandler): void;
  // only for input pin
  removeListener(handler: GpioDigitalDriverHandler): void;
}
