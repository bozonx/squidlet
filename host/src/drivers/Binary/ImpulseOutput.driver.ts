import {DigitalPinOutputDriver, DigitalPinOutputDriverProps} from '../DigitalPin/DigitalPinOutput.driver';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {BlockMode} from './interfaces/Types';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {omit} from '../../helpers/lodashLike';


export interface ImpulseOutputDriverProps extends DigitalPinOutputDriverProps {
  // time between 1 and 0
  impulseLength: number;
  blockTime: number;
  // if "refuse" - it doesn't write while block time.
  // If "defer" it waits for block time finished and write last write request
  blockMode: BlockMode;
  // for input: when receives 1 actually returned 0 and otherwise
  // for output: when sends 1 actually sends 0 and otherwise
  invert?: boolean;
}


export class ImpulseOutputDriver extends DriverBase<ImpulseOutputDriverProps> {
  private deferredImpulse?: boolean;
  private impulseInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;

  private get digitalOutput(): DigitalPinOutputDriver {
    return this.depsInstances.digitalOutput as DigitalPinOutputDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalOutput = await getDriverDep('DigitalPinOutput.driver')
      .getInstance(omit(this.props, 'impulseLength', 'blockTime', 'blockMode'));
  }


  isBlocked(): boolean {
    return this.blockTimeInProgress;
  }

  async read(): Promise<boolean> {
    return this.digitalOutput.read();
  }

  async impulse() {
    // skip while switch at block time or impulse is in progress
    if (this.impulseInProgress || this.blockTimeInProgress) {
      if (this.props.blockMode === 'refuse') {
        // don't write while block time if impulse is in progress
        return;
      }
      else {
        // mark that there is a deferred impulse
        this.deferredImpulse = true;

        return;
      }
    }

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


  protected validateProps = (): string | undefined => {
    // TODO: ???!!!!
    return;
  }


  private impulseFinished = async () => {
    await this.digitalOutput.write(false);
    this.impulseInProgress = false;
    this.blockTimeInProgress = true;

    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.blockTimeFinished()
          .then(resolve)
          .catch(reject);
      }, this.props.blockTime);
    });
  }


  private blockTimeFinished = async () => {
    this.blockTimeInProgress = false;

    if (this.props.blockMode === 'defer' && typeof this.deferredImpulse !== 'undefined') {
      // clear deferred value
      this.deferredImpulse = undefined;
      // make deferred impulse
      await this.impulse();
    }
  }

}


export default class Factory extends DriverFactoryBase<ImpulseOutputDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = ImpulseOutputDriver;
}
