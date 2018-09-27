import DigitalBaseProps from './interfaces/DigitalBaseProps';
import DriverBase from '../../app/entities/DriverBase';
import {DigitalInputDriver, DigitalInputDriverProps, DigitalInputListenHandler} from './DigitalInput.driver';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {resolveDriverName} from './digitalHelpers';
import Digital from '../../app/interfaces/dev/Digital';


export interface ImpulseInputDriverProps extends DigitalInputDriverProps {
  // listen for impulse
  impulseLength: number;
}


export class ImpulseInputDriver extends DriverBase<ImpulseInputDriverProps> {
  private get digitalInput(): DigitalInputDriver {
    return this.depsInstances.digitalInput as DigitalInputDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalInput = getDriverDep('DigitalInput.driver')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    const debounce: number = Math.ceil(this.props.impulseLength / 2);

    this.digitalInput.addListener(this.listenHandler, debounce, 'rising');
  }

  // TODO: read - считывает физически или отдает текущее значение???
  // TODO:  еси физически то нужно ли обновить статуст???

  addListener(handler: DigitalInputListenHandler) {
    // TODO: !!!!
  }

  listenOnce() {
    // TODO: !!!!
  }

  removeListener() {
    // TODO: !!!!
  }

  destroy = () => {
    this.digitalInput.removeListener(this.listenHandler);
  }


  protected validateProps = (): string | undefined => {
    // TODO: impulseLength не может быть 0 или меньше
  }


  private listenHandler = () => {

  }

}

export default class Factory {
  async getInstance(instanceProps?: ImpulseInputDriverProps): Promise<ImpulseInputDriver> {
    // TODO: merge props
    return new ImpulseInputDriver();
  }
}
