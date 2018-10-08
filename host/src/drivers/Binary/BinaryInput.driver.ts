const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');
const _omit = require('lodash/omit');
import * as EventEmitter from 'eventemitter3';

import DebounceType from '../Digital/interfaces/DebounceType';
import DriverBase from '../../app/entities/DriverBase';
import {DigitalInputDriver, DigitalInputDriverProps, DigitalInputListenHandler} from '../Digital/DigitalInput.driver';
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
    this.depsInstances.digitalInput = await getDriverDep('DigitalInput.driver')
      .getInstance(_omit(this.props, 'debounce', 'debounceType', 'blockTime'));
  }

  protected didInit = async () => {
    this.digitalInput.addListener(this.listenHandler, this.props.debounce);
  }


  async read(): Promise<boolean> {
    return this.digitalInput.read();
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
    // TODO: ???!!!!
    return;
  }


  private listenHandler = async (level: boolean) => {
    // do nothing if there are block time or throttle
    if (this.blockTimeInProgress || this.throttleInProgress) return;

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
      // emit an event
      this.events.emit(eventName, level);
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
