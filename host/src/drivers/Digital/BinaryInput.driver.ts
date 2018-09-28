const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');
import * as EventEmitter from 'eventemitter3';

import DebounceType from './interfaces/DebounceType';
import DriverBase from '../../app/entities/DriverBase';
import {DigitalInputDriver, DigitalInputDriverProps, DigitalInputListenHandler} from './DigitalInput.driver';
import {GetDriverDep} from '../../app/entities/EntityBase';


const eventName = 'change';


export interface BinaryInputDriverProps extends DigitalInputDriverProps {
  debounce: number;
  debounceType: DebounceType;
  // in this time driver doesn't receive any data
  blockTime: number;
}


export class BinaryInputDriver extends DriverBase<BinaryInputDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();
  private throttleInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;

  private get digitalInput(): DigitalInputDriver {
    return this.depsInstances.digitalInput as DigitalInputDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    // TODO: если throttle то наверное debounce 0 по умолчанию
    this.depsInstances.digitalInput = getDriverDep('DigitalInput.driver')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    // TODO: !!!!!
    // const debounce: number = this.props.impulseLength;
    //
    // this.digitalInput.addListener(this.listenHandler, debounce, 'rising');
  }


  read() {
    // TODO: read - считывает физически или отдает текущее значение???
    // TODO:  еси физически то нужно ли обновить статуст???
  }

  /**
   * Listen to rising and faling of impulse (1 and 0 levels)
   */
  addListener(handler: DigitalInputListenHandler) {
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
    return;
  }


  private listenHandler = async (level: boolean) => {
    // do nothing if there is block time
    if (this.blockTimeInProgress) return;

    try {
      if (this.props.debounceType === 'throttle') {
        // throttle logic
        await this.throttle();
      }
      else {
        // debounce logic
        await this.startBlockTime(async () => level);
      }
    }
    catch (err) {
      this.env.log.error(err);
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
        this.startBlockTime(() => this.digitalInput.read())
          .then(resolve)
          .catch(reject);
      }, this.props.debounce);
    });
  }

  private async startBlockTime(getLevel: () => Promise<boolean>): Promise<void> {
    // start block time - ignore all the signals
    this.blockTimeInProgress = true;

    try {
      const level: boolean = await getLevel();
      // set it to status
      // TODO: wait for promise ???
      this.setStatus(level);
    }
    catch (err) {
      this.blockTimeInProgress = false;

      throw err;
    }

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.blockTimeInProgress = false;
        resolve();
      }, this.props.blockTime);
    });
  }

}

export default class Factory extends DriverBase<BinaryInputDriverProps> {
  async getInstance(instanceProps?: BinaryInputDriverProps): Promise<BinaryInputDriver> {
    const definition = {
      ...this.definition,
      props: _defaultsDeep(_cloneDeep(instanceProps), this.definition.props),
    };

    return new BinaryInputDriver(definition, this.env);
  }
}
