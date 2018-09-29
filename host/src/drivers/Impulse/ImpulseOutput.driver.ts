const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');
const _omit = require('lodash/omit');
import * as EventEmitter from 'eventemitter3';

import {DigitalOutputDriver, DigitalOutputDriverProps} from '../Digital/DigitalOutput.driver';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import BlockMode from './interfaces/BlockMode';


// const risingEventName = 'rising';
// const bothEventName = 'both';


export interface ImpulseOutputDriverProps extends DigitalOutputDriverProps {
  // time between 1 and 0
  impulseLength: number;
  blockTime: number;
  // if "refuse" - it doesn't write while block time.
  // If "defer" it waits for block time finished and write last write request
  blockMode: BlockMode;
}


export class ImpulseOutputDriver extends DriverBase<ImpulseOutputDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();
  private impulseInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;

  private get digitalOutput(): DigitalOutputDriver {
    return this.depsInstances.digitalOutput as DigitalOutputDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalOutput = getDriverDep('DigitalOutput.driver')
      .getInstance(_omit(this.props, 'impulseLength', 'blockTime'));
  }

  protected didInit = async () => {
    //this.digitalInput.addListener(this.listenHandler, this.props.debounce);
  }


  async read(): Promise<boolean> {
    return this.digitalOutput.read();
  }

  async impulse() {
    // TODO: use block mode
    // skip while switch at block time or impulse is in progress
    if (this.impulseInProgress || this.blockTimeInProgress) return;

    this.impulseInProgress = true;

    await this.digitalOutput.write(true);

    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.impulseFinished()
          .then(resolve)
          .catch(reject);
      }, this.props.impulseLength);
    });
  }

  async impulseFinished() {
    this.digitalOutput.write(false);
    this.impulseInProgress = false;
    this.blockTimeInProgress = true;

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.blockTimeInProgress = true;
        resolve();
      }, this.props.blockTime);
    });
  }


  protected validateProps = (): string | undefined => {
    // TODO: ???!!!!
    return;
  }

}

export default class Factory extends DriverBase<ImpulseOutputDriverProps> {
  async getInstance(instanceProps?: ImpulseOutputDriverProps): Promise<ImpulseOutputDriver> {
    const definition = {
      ...this.definition,
      props: _defaultsDeep(_cloneDeep(instanceProps), this.definition.props),
    };

    return new ImpulseOutputDriver(definition, this.env);
  }
}
