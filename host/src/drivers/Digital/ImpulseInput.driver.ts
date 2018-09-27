import * as EventEmitter from 'eventemitter3';

import DriverBase from '../../app/entities/DriverBase';
import {DigitalInputDriver, DigitalInputDriverProps, DigitalInputListenHandler} from './DigitalInput.driver';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DebounceType from './interfaces/DebounceType';


const eventName = 'change';


export interface ImpulseInputDriverProps extends DigitalInputDriverProps {
  impulseLength: number;
  debounceType: DebounceType;
  blockTime: number;
}


export class ImpulseInputDriver extends DriverBase<ImpulseInputDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();
  private throttleInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;

  private get digitalInput(): DigitalInputDriver {
    return this.depsInstances.digitalInput as DigitalInputDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalInput = getDriverDep('DigitalInput.driver')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    //const debounce: number = Math.ceil(this.props.impulseLength / 2);
    const debounce: number = this.props.impulseLength;

    this.digitalInput.addListener(this.listenHandler, debounce, 'rising');
  }

  // TODO: read - считывает физически или отдает текущее значение???
  // TODO:  еси физически то нужно ли обновить статуст???

  addListener(handler: DigitalInputListenHandler) {
    // TODO: !!!!
    // TODO: !!!! может добавить параметр risingOnly ??? и не поднимать 0

    this.events.addListener(eventName, handler);
  }

  listenOnce(handler: DigitalInputListenHandler) {
    this.events.once(eventName, handler);
  }

  removeListener(handler: DigitalInputListenHandler) {
    this.events.removeListener(eventName, handler);
  }

  destroy = () => {
    this.digitalInput.removeListener(this.listenHandler);
  }


  protected validateProps = (): string | undefined => {
    // TODO: impulseLength не может быть 0 или меньше
    return;
  }


  private listenHandler = () => {
    // TODO: throttle если указан

  }

  private async throttle() {
    // do nothing if there is debounce or dead time
    if (this.throttleInProgress) return;

    this.throttleInProgress = true;

    // waiting for debounce
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.throttleInProgress = false;
        this.startBlockTime(() => this.digitalInput.read())
          .then(resolve)
          .catch(reject);
      }, this.props.debounce);
    });
  }

}

export default class Factory {
  async getInstance(instanceProps?: ImpulseInputDriverProps): Promise<ImpulseInputDriver> {
    // TODO: merge props
    return new ImpulseInputDriver();
  }
}
