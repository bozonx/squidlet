import {DriverBaseProps} from '../entities/DriverBase';


export default interface DigitalBaseProps extends DriverBaseProps {
  pin: number;
  // for input: when receives 1 actually returned 0 and otherwise
  // for output: when sends 1 actually sends 0 and otherwise
  invert?: boolean;
  // by default is local driver used
  driver?: {
    name: string;
    // Physical driver's params
    [index: string]: any;
  };

  // TODO: ??? valueLogLevel
}
