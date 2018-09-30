const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');
const _omit = require('lodash/omit');

import {DigitalOutputDriver, DigitalOutputDriverProps} from '../Digital/DigitalOutput.driver';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import BlockMode from './interfaces/BlockMode';


export interface BinaryOutputDriverProps extends DigitalOutputDriverProps {
  blockTime: number;
  // if "refuse" - it doesn't write while block time.
  // If "defer" it waits for block time finished and write last write request
  blockMode: BlockMode;
}


export class BinaryOutputDriver extends DriverBase<BinaryOutputDriverProps> {
  private blockTimeInProgress: boolean = false;
  private lastDeferredValue?: boolean;

  private get digitalOutput(): DigitalOutputDriver {
    return this.depsInstances.digitalOutput as DigitalOutputDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalOutput = getDriverDep('DigitalOutput.driver')
      .getInstance(_omit(this.props, 'blockTime', 'blockMode'));
  }


  isBlocked(): boolean {
    return this.blockTimeInProgress;
  }

  async read(): Promise<boolean> {
    return this.digitalOutput.read();
  }

  async write(level: boolean) {
    if (this.blockTimeInProgress) {
      if (this.props.blockMode === 'refuse') {
        // don't write while block time
        return;
      }
      else {
        // store that level which delayed
        this.lastDeferredValue = level;

        return;
      }
    }

    this.blockTimeInProgress = true;

    await this.digitalOutput.write(level);

    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.blockTimeFinished()
          .then(resolve)
          .catch(reject);
      }, this.props.blockTime);
    });
  }


  protected validateProps = (): string | undefined => {
    // TODO: ???!!!!
    return;
  }


  private blockTimeFinished = async () => {
    this.blockTimeInProgress = false;

    if (this.props.blockMode === 'defer' && typeof this.lastDeferredValue !== 'undefined') {
      const lastDeferredValue = this.lastDeferredValue;
      // clear deferred value
      this.lastDeferredValue = undefined;
      // write deferred value
      await this.write(lastDeferredValue);
    }
  }

}

export default class Factory extends DriverBase<BinaryOutputDriverProps> {
  async getInstance(instanceProps?: BinaryOutputDriverProps): Promise<BinaryOutputDriver> {
    const definition = {
      ...this.definition,
      props: _defaultsDeep(_cloneDeep(instanceProps), this.definition.props),
    };

    return new BinaryOutputDriver(definition, this.env);
  }
}
