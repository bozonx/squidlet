import DigitalBaseProps from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/GpioPinBaseProps.js';
import {EdgeString} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/gpioTypes.js';


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
