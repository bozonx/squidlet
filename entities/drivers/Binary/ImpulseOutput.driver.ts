import {DigitalPinOutputDriver, DigitalPinOutputDriverProps} from '../DigitalPin/DigitalPinOutput.driver';
import DriverBase from 'host/baseDrivers/DriverBase';
import {GetDriverDep} from 'host/entities/EntityBase';
import {BlockMode} from './interfaces/Types';
import DriverFactoryBase from 'host/baseDrivers/DriverFactoryBase';
import {omit} from 'host/helpers/lodashLike';
import {deferCall, invertIfNeed} from 'host/helpers/helpers';


export interface ImpulseOutputDriverProps extends DigitalPinOutputDriverProps {
  // time or rising state
  impulseLength: number;
  blockTime: number;
  // if "refuse" - it doesn't write while block time.
  // If "defer" it waits for block time finished and write last write request
  blockMode: BlockMode;
  // if true when sends 1 actually sends 0
  invert: boolean;
}


export class ImpulseOutputDriver extends DriverBase<ImpulseOutputDriverProps> {
  private deferredImpulse: boolean = false;
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
        initialLevel: invertIfNeed(false, this.props.invert),
      });
  }


  isBlocked(): boolean {
    return this.blockTimeInProgress;
  }

  async read(): Promise<boolean> {
    //return this.digitalOutput.read();

    return this.impulseInProgress;
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

    await this.digitalOutput.write(invertIfNeed(true, this.props.invert));

    return deferCall<void>(this.impulseFinished, this.props.impulseLength);
  }


  private impulseFinished = async () => {
    await this.digitalOutput.write(invertIfNeed(false, this.props.invert));
    this.impulseInProgress = false;

    this.startBlockTime();
  }

  private startBlockTime(): void {
    // if block time isn't set = try to write deferred value if is set
    if (!this.props.blockTime) return this.writeDeferred();

    this.blockTimeInProgress = true;

    setTimeout(() => {
      this.blockTimeInProgress = false;
      this.writeDeferred();
    }, this.props.blockTime);
  }

  private writeDeferred(): void {
    // do nothing if blockMode isn't defer or deffered impulse isn't in a queue
    if (this.props.blockMode !== 'defer' || !this.deferredImpulse) return;

    // clear deferred value
    this.deferredImpulse = false;
    // make deferred impulse
    this.impulse()
      .catch((err) => {
        this.env.system.log.error(`ImpulseOutput.driver: Error with writing deferred impulse: ${String(err)}`);
      });
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
