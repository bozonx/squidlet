import {Edge} from '../../../app/interfaces/dev/Digital';

export type GpioDigitalDriverHandler = (level: boolean) => void;
export type PullResistor = 'pullup' | 'pulldown' | 'none';

// export interface GpioDigitalDriverPinParams extends DriverBaseProps {
//   direction: 'input' | 'output';
//
//   // initial value for output pin
//   initial?: boolean;
//
//   // use pullup resistor. Only for input pin
//   pullup?: boolean;
//   // use pulldown resistor. Only for input pin
//   pulldown?: boolean;
//   // debounce time in ms only for input pins. If not set system defaults will be used.
//   debounce?: number;
//   // Listen to low, high or both levels. By default is both.
//   edge?: Edge;
// }


export default interface GpioDigitalDriver {
  //setup(pin: number, params: GpioDigitalDriverPinParams): Promise<void>;

  setupInput(pin: number, pullResistor: PullResistor, debounce: number, edge?: Edge): Promise<void>;
  setupOutput(pin: number, initial?: boolean): Promise<void>;

  getLevel(pin: number): Promise<boolean>;
  // only for output pin
  setLevel(pin: number, level: boolean): Promise<void>;
  // only for input pin
  addListener(pin: number, handler: GpioDigitalDriverHandler): void;
  // only for input pin
  removeListener(pin: number, handler: GpioDigitalDriverHandler): void;
}
