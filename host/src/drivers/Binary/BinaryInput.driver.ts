const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');
const _omit = require('lodash/omit');
import * as EventEmitter from 'eventemitter3';

import DriverBase from '../../app/entities/DriverBase';
import {DigitalInputDriver, DigitalInputDriverProps, DigitalInputListenHandler} from '../Digital/DigitalInput.driver';
import {GetDriverDep} from '../../app/entities/EntityBase';


const eventName = 'change';


export interface BinaryInputDriverProps extends DigitalInputDriverProps {
  debounce: number;
  // in this time driver doesn't receive any data
  blockTime: number;
}


export class BinaryInputDriver extends DriverBase<BinaryInputDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();
  private blockTimeInProgress: boolean = false;

  private get digitalInput(): DigitalInputDriver {
    return this.depsInstances.digitalInput as DigitalInputDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalInput = await getDriverDep('DigitalInput.driver')
      .getInstance(_omit(this.props, 'debounce', 'blockTime'));
  }

  protected didInit = async () => {

    // TODO: pass edge

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
    // do nothing if there is block time
    if (this.blockTimeInProgress) return;

    this.events.emit(eventName, level);

    if (!this.props.blockTime) return;

    // start block time
    this.blockTimeInProgress = true;

    setTimeout(() => {
      this.blockTimeInProgress = false;
    }, this.props.blockTime);
  }

}

export default class Factory extends DriverBase<BinaryInputDriverProps> {

  // TODO: всегда новый инстанс чтоли??? или по pin ???

  async getInstance(instanceProps?: BinaryInputDriverProps): Promise<BinaryInputDriver> {
    const definition = {
      ...this.definition,
      props: _defaultsDeep(_cloneDeep(instanceProps), this.definition.props),
    };

    const driver = new BinaryInputDriver(definition, this.env);
    await driver.init();

    return driver;
  }
}
