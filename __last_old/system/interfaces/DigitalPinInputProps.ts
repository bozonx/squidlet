import DigitalBaseProps from './GpioPinBaseProps';
import {EdgeString} from './gpioTypes';


export default interface DigitalPinInputProps extends DigitalBaseProps {
  // Listen to low, high or both levels. By default is both.
  edge: EdgeString;
  // debounce time in ms only for input pins. If not set system defaults will be used.
  debounce: number;
  // if no one of pullup and pulldown are set then both resistors will off
  // use pullup resistor
  pullup?: boolean;
  // use pulldown resistor
  pulldown?: boolean;
}
