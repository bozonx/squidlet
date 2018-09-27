const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');
import * as EventEmitter from 'eventemitter3';

import DriverBase from '../../app/entities/DriverBase';
import {DigitalInputDriver, DigitalInputDriverProps, DigitalInputListenHandler} from './DigitalInput.driver';
import {GetDriverDep} from '../../app/entities/EntityBase';


const eventName = 'change';


export interface BinaryInputDriverProps extends DigitalInputDriverProps {
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
    this.depsInstances.digitalInput = getDriverDep('DigitalInput.driver')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    // TODO: !!!!!
    // const debounce: number = this.props.impulseLength;
    //
    // this.digitalInput.addListener(this.listenHandler, debounce, 'rising');
  }

  // TODO: read - считывает физически или отдает текущее значение???
  // TODO:  еси физически то нужно ли обновить статуст???

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


  private listenHandler = async () => {

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
