import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase, {DriverBaseProps} from '../../app/entities/DriverBase';


export interface DigitalLocalDriverProps extends DriverBaseProps {
  pin: number;
  direction: 'in' | 'out';
}


export class DigitalLocalDriver extends DriverBase<DigitalLocalDriverProps> {
  async getLevel(pin: number): Promise<boolean> {
    // TODO: !!!
  }

  /**
   * Set level to output pin
   */
  async setLevel(pin: number, level: boolean): Promise<void> {
    // TODO: если пин сконфигурирован на input - ругаться
    // TODO: !!!
  }

}


export default class GpioInputFactory extends DriverFactoryBase<DigitalLocalDriver, DigitalLocalDriverProps> {
  // TODO: поидее всегда будет один инстанс
  protected instanceIdName: string = 'local';
  protected DriverClass = DigitalLocalDriver;
}
