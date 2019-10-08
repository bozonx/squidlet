import DriverBase from 'system/base/DriverBase';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {omitObj} from 'system/lib/objects';
import {invertIfNeed} from 'system/lib/helpers';
import {BlockMode} from 'system/interfaces/Types';

import {DigitalPinOutput, DigitalPinOutputProps} from '../../../system/lib/base/digital/DigitalPinOutput';


export interface ImpulseOutputProps extends DigitalPinOutputProps {
  // time or rising state
  impulseLength: number;
  blockTime: number;
  // if "refuse" - it doesn't write while block time.
  // If "defer" it waits for block time finished and write last write request
  blockMode: BlockMode;
  // if true when sends 1 actually sends 0
  invert: boolean;
}




// TODO: review
// TODO: test
export function deferCall<T>(cb: () => any, delayMs: number): Promise<T> {
  // TODO: rerutn an object and add method - cancel
  return new Promise<T>((resolve, reject) => {
    setTimeout(async () => {
      try {
        resolve(await cb());
      }
      catch(err) {
        reject(err);
      }
    }, delayMs);
  });
}



export class ImpulseOutput extends DriverBase<ImpulseOutputProps> {
  private deferredImpulse: boolean = false;
  private impulseInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;

  private get digitalOutput(): DigitalPinOutput {
    return this.depsInstances.digitalOutput;
  }


  init = async () => {
    this.depsInstances.digitalOutput = await this.context.getSubDriver(
      'DigitalPinOutput',
      {
        ...omitObj(
          this.props,
          'impulseLength',
          'blockTime',
          'blockMode',
          'invert',
        ),
        initialLevel: invertIfNeed(false, this.props.invert),
      }
    );
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
        this.log.error(`ImpulseOutput: Error with writing deferred impulse: ${String(err)}`);
      });
  }


  protected validateProps = (): string | undefined => {
    // TODO: ???!!!!
    return;
  }

}


export default class Factory extends DriverFactoryBase<ImpulseOutput, ImpulseOutputProps> {
  protected SubDriverClass = ImpulseOutput;
  // TODO: add instanceId
}
