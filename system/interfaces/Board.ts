import {PinDirection} from './io/DigitalIo';


export interface BoardPin {
  hasPullUp: boolean;
  hasPullDown: boolean;
  hasOpenDrain: boolean;
  // support of interruption on pin
  hasInterruption: boolean;
  directions: PinDirection | 'both';

  // TODO: add analog, pwm etc
}


export default interface Board {
  // specification for all the pins
  defaultPin?: BoardPin;
  // specification for not default pins. It overrides the "defaultPin" specification
  pins?: {[index: string]: BoardPin};
}
