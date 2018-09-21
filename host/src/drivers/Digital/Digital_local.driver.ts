import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase, {DriverBaseProps} from '../../app/entities/DriverBase';


export interface DigitalLocalDriverProps extends DriverBaseProps {
  pin: number;
  direction: 'in' | 'out';
}


export class DigitalLocalDriver extends DriverBase<DigitalLocalDriverProps> {
}


export default class GpioInputFactory extends DriverFactoryBase<DigitalLocalDriver, DigitalLocalDriverProps> {
  // TODO: поидее всегда будет один инстанс
  protected instanceIdName: string = 'local';
  protected DriverClass = DigitalLocalDriver;
}
