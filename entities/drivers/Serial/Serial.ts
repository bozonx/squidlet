import DriverFactoryBase from '../../../system/base/DriverFactoryBase';
import {SerialDuplex, SerialDuplexProps} from '../SerialDuplex/SerialDuplex';
import DuplexDriver from '../../../system/interfaces/DuplexDriver';
import DriverBase from '../../../system/base/DriverBase';


export class Serial extends DriverBase<SerialDuplexProps> implements DuplexDriver {

}


export default class Factory extends DriverFactoryBase<Serial> {
  protected DriverClass = Serial;

  // TODO: review
  // protected instanceIdCalc = (props: {[index: string]: any}): string => {
  //   return String(props.uartNum);
  // }
}
