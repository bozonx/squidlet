const _omit = require('lodash/omit');

import DriverFactoryBase, {InstanceType} from '../../app/entities/DriverFactoryBase';
import {DigitalOutputDriver, DigitalOutputDriverProps} from '../Digital/DigitalOutput.driver';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import BlockMode from './interfaces/BlockMode';


export interface BinaryOutputDriverProps extends DigitalOutputDriverProps {
  blockTime: number;
  // if "refuse" - it doesn't write while block time. It is on default.
  // If "defer" it waits for block time finished and write last last value which was tried to set
  blockMode: BlockMode;
}


export class BinaryOutputDriver extends DriverBase<BinaryOutputDriverProps> {
  private blockTimeInProgress: boolean = false;
  private lastDeferredValue?: boolean;

  private get digitalOutput(): DigitalOutputDriver {
    return this.depsInstances.digitalOutput as DigitalOutputDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {

    console.log(555555555, this.props);

    this.depsInstances.digitalOutput = await getDriverDep('DigitalOutput.driver')
      .getInstance(_omit(this.props, 'blockTime', 'blockMode'));
  }


  isBlocked(): boolean {
    return this.blockTimeInProgress;
  }

  async read(): Promise<boolean> {
    return this.digitalOutput.read();
  }


  // TODO: что будет при последующих запросаз ???

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

    // normal write

    this.blockTimeInProgress = true;

    try {
      await this.digitalOutput.write(level);
    }
    catch (err) {
      this.blockTimeInProgress = false;

      throw(new Error(`BinaryOutputDriver: Can't write "${level}",
        props: "${JSON.stringify(this.props)}". ${err.toString()}`));
    }

    // starting block time

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

    // setting last delayed value
    if (this.props.blockMode === 'defer' && typeof this.lastDeferredValue !== 'undefined') {
      const lastDeferredValue = this.lastDeferredValue;
      // clear deferred value
      this.lastDeferredValue = undefined;
      // write deferred value
      await this.write(lastDeferredValue);
    }
  }

}


export default class Factory extends DriverFactoryBase<BinaryOutputDriver> {
  protected DriverClass = BinaryOutputDriver;
  protected instanceType: InstanceType = 'alwaysNew';
}
