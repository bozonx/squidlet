import * as EventEmitter from 'eventemitter3';

import DriverBase from '../../app/entities/DriverBase';
import {DigitalInputDriver, DigitalInputDriverProps, DigitalInputListenHandler} from './DigitalInput.driver';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DebounceType from './interfaces/DebounceType';


const risingEventName = 'rising';
const bothEventName = 'both';


export interface ImpulseInputDriverProps extends DigitalInputDriverProps {
  impulseLength: number;
  // TODO: по умолчанию debounce
  //debounceType: DebounceType;
  // TODO: по умолчанию 0
  blockTime: number;

  // if specified - it will wait for specified time
  // and after that read level and start impulse if level is 1
  throttle?: number;
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

  addListener(handler: DigitalInputListenHandler, risingOnly: boolean) {
    if (risingOnly) {
      this.events.addListener(risingEventName, handler);
    }
    else {
      this.events.addListener(bothEventName, handler);
    }
  }

  listenOnce(handler: DigitalInputListenHandler) {
    this.events.once(risingEventName, handler);
  }

  removeListener(handler: DigitalInputListenHandler) {
    this.events.removeListener(risingEventName, handler);
    this.events.removeListener(bothEventName, handler);
  }

  destroy = () => {
    this.digitalInput.removeListener(this.listenHandler);
  }


  protected validateProps = (): string | undefined => {
    // TODO: impulseLength не может быть 0 или меньше
    // TODO: throttle не может быть 0 или меньше
    return;
  }


  private listenHandler = async () => {
    if (typeof this.props.throttle === 'undefined') {

      // TODO: simple
    }
    else {
      await this.throttle();
    }
  }

  private async throttle() {
    // do nothing throttle is in progress
    if (this.throttleInProgress) return;

    this.throttleInProgress = true;

    // waiting for debounce
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.throttleInProgress = false;
        this.startImpulse(() => this.digitalInput.read())
          .then(resolve)
          .catch(reject);
      }, Number(this.props.throttle));
    });
  }

  private async startImpulse(getLevel: () => Promise<boolean>): Promise<void> {

  }

}

export default class Factory {
  async getInstance(instanceProps?: ImpulseInputDriverProps): Promise<ImpulseInputDriver> {
    // TODO: merge props
    return new ImpulseInputDriver();
  }
}
