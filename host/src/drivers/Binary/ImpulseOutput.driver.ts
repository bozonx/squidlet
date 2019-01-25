import {DigitalPinOutputDriver, DigitalPinOutputDriverProps} from '../DigitalPin/DigitalPinOutput.driver';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {BlockMode} from './interfaces/Types';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {omit} from '../../helpers/lodashLike';
import {deferCall} from '../../helpers/helpers';


export interface ImpulseOutputDriverProps extends DigitalPinOutputDriverProps {
  // time or rising state
  impulseLength: number;
  blockTime: number;
  // TODO: review
  // if "refuse" - it doesn't write while block time.
  // If "defer" it waits for block time finished and write last write request
  blockMode: BlockMode;
  // if true when sends 1 actually sends 0
  invert: boolean;
}


export class ImpulseOutputDriver extends DriverBase<ImpulseOutputDriverProps> {
  // TODO: review
  private deferredImpulse?: boolean;
  private impulseInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;

  private get digitalOutput(): DigitalPinOutputDriver {
    return this.depsInstances.digitalOutput as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalOutput = await getDriverDep('DigitalPinOutput.driver')
      .getInstance({
        ...omit(
          this.props,
          'impulseLength',
          'blockTime',
          'blockMode',
          'invert',
        ),
        // TODO: resilve using invert
        initialLevel: 0,
      });
  }


  isBlocked(): boolean {
    return this.blockTimeInProgress;
  }

  async read(): Promise<boolean> {

    // TODO: return current state

    return this.digitalOutput.read();
  }

  /**
   * Start impulse
   */
  async impulse(): Promise<void> {
    // skip while switch at block time or impulse is in progress
    if (this.impulseInProgress || this.blockTimeInProgress) {
      if (this.props.blockMode === 'defer') {
        // mark that there is a deferred impulse and exit
        this.deferredImpulse = true;
      }
      // else if is "refuse": don't write while block time if impulse is in progress
      return;
    }

    // start the new impulse

    this.impulseInProgress = true;

    await this.digitalOutput.write(true);

    return deferCall<void>(this.impulseFinished, this.props.impulseLength);
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


  protected validateProps = (): string | undefined => {
    // TODO: ???!!!!
    return;
  }

}


export default class Factory extends DriverFactoryBase<ImpulseOutputDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = ImpulseOutputDriver;
}
