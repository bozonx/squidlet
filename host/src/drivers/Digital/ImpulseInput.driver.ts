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
  private impulseInProgress: boolean = false;
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

  /**
   * Listen only to rising of impulse, not falling.
   */
  addRisingListener(handler: DigitalInputListenHandler) {
    this.events.addListener(risingEventName, handler);
  }

  /**
   * Listen to rising and faling of impulse (1 and 0 levels)
   */
  addListener(handler: DigitalInputListenHandler) {
    this.events.addListener(bothEventName, handler);
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
    // don't process new impulse while current is in progress
    if (this.throttleInProgress || this.impulseInProgress || this.blockTimeInProgress) return;

    if (typeof this.props.throttle === 'undefined') {
      await this.startImpulse();
    }
    else {
      await this.throttle();
    }
  }

  private async throttle(): Promise<void> {
    this.throttleInProgress = true;

    // waiting and then read level
    return new Promise<void>((resolve, reject) => {
      setTimeout(async () => {
        const currentValue: boolean = await this.digitalInput.read();

        this.throttleInProgress = false;

        // if level is 0 - it isn't an impulse - do nothing
        if (!currentValue) return;

        this.startImpulse()
          .then(resolve)
          .catch(reject);
      }, Number(this.props.throttle));
    });
  }

  private async startImpulse(): Promise<void> {
    this.impulseInProgress = true;

    this.events.emit(risingEventName);
    this.events.emit(bothEventName, 1);

    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.events.emit(bothEventName, 0);
        this.impulseInProgress = false;

        if (this.props.blockTime) {
          this.startBlockTime()
            .then(resolve)
            .catch(reject);
        }
        else {
          resolve();
        }
      }, this.props.impulseLength);
    });
  }

  private async startBlockTime(): Promise<void> {
    this.blockTimeInProgress = true;

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.blockTimeInProgress = false;

        resolve();
      }, this.props.blockTime);
    });
  }

}

export default class Factory {
  async getInstance(instanceProps?: ImpulseInputDriverProps): Promise<ImpulseInputDriver> {
    // TODO: merge props
    return new ImpulseInputDriver();
  }
}
