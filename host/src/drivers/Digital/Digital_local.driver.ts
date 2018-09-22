import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase, {DriverBaseProps} from '../../app/entities/DriverBase';
import {GpioDigitalDriverHandler} from './interfaces/GpioDigitalDriver';
import Digital from '../../app/interfaces/dev/Digital';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {resolveDriverName} from './digitalHelpers';


export interface DigitalLocalDriverProps extends DriverBaseProps {
}


export class DigitalLocalDriver extends DriverBase<DigitalLocalDriverProps> {
  private get digitalDev(): Digital {
    return this.depsInstances.digitalDev as Digital;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digital = getDriverDep('Digital.dev');
  }


  // TODO: setup !!!!

  getLevel(pin: number): Promise<boolean> {
    return this.digitalDev.read(pin);
  }

  /**
   * Set level to output pin
   */
  setLevel(pin: number, level: boolean): Promise<void> {
    // TODO: если пин сконфигурирован на input - ругаться

    return this.digitalDev.write(pin, level);
  }

  /**
   * Listen to interruption of input pin
   */
  addListener(handler: GpioDigitalDriverHandler): void {
    // TODO: если пин сконфигурирован на output - ругаться

    // TODO: !!!
  }

  removeListener(handler: GpioDigitalDriverHandler): void {
    // TODO: !!!
  }

}


export default class GpioInputFactory extends DriverFactoryBase<DigitalLocalDriver, DigitalLocalDriverProps> {
  // TODO: поидее всегда будет один инстанс
  protected instanceIdName: string = 'local';
  protected DriverClass = DigitalLocalDriver;
}
