import DigitalBaseProps from './interfaces/DigitalBaseProps';
import DriverBase from '../../app/entities/DriverBase';
import {DigitalInputDriver, DigitalInputDriverProps} from './DigitalInput.driver';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {resolveDriverName} from './digitalHelpers';
import Digital from '../../app/interfaces/dev/Digital';


export interface ImpulseInputDriverProps extends DigitalBaseProps {
  // listen for impulse
  impulseLength: number;
}


export class ImpulseInputDriver extends DriverBase<DigitalInputDriverProps> {
  private get digitalInput(): DigitalInputDriver {
    return this.depsInstances.digitalInput as DigitalInputDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalInput = getDriverDep(driverName).getInstance(_omit(this.props.driver, 'name'));

    await this.digitalInput.setup(this.props.pin, this.resolvePinMode());
  }


  /**
   * Put this handler to your DigitalInput.driver's listener.
   */
  changeHandler = (value: boolean) => {

  }

  addListener(handler: () => void) {

  }

}

export default class Factory {
  async getInstance(instanceProps?: ImpulseInputDriverProps): Promise<ImpulseInputDriver> {
    // TODO: merge props
    return new ImpulseInputDriver();
  }
}
