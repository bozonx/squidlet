import DriverBase from 'system/base/DriverBase';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {omitObj} from 'system/lib/objects';
import {invertIfNeed, isDigitalPinInverted} from 'system/lib/helpers';
import {JsonTypes} from 'system/interfaces/Types';
import SourceDriverFactoryBase from 'system/lib/base/digital/SourceDriverFactoryBase';
import {
  generateSubDriverId,
  makeDigitalSourceDriverName,
  resolveOutputPinMode,
} from 'system/lib/base/digital/digitalHelpers';
import DigitalIo, {ChangeHandler} from 'system/interfaces/io/DigitalIo';
import IndexedEvents from 'system/lib/IndexedEvents';
import DigitalPinOutputProps from 'system/lib/base/digital/interfaces/DigitalPinOutputProps';
import {DigitalOutputMode} from 'system/interfaces/io/DigitalIo';


type ImpulseOutputMode = 'fixed' | 'defer' | 'increasing';

export interface ImpulseOutputProps extends DigitalPinOutputProps {
  // duration of impulse in ms
  impulseLength: number;
  // in this time driver doesn't receive any data
  blockTime: number;
  // if "fixed" - Make fixed impulse and refuse other calls while impulse or block time are in progress.
  // If "defer" it waits for block time finished and write last write request
  blockMode: ImpulseOutputMode;
  // invert value which is sent to IO
  invert?: boolean;
  // turn value inverted if open drain mode is used
  invertOnOpenDrain: boolean;
}


// TODO: review
// export function deferCall<T>(cb: () => any, delayMs: number): Promise<T> {
//   // TODO: rerutn an object and add method - cancel
//   return new Promise<T>((resolve, reject) => {
//     setTimeout(async () => {
//       try {
//         resolve(await cb());
//       }
//       catch(err) {
//         reject(err);
//       }
//     }, delayMs);
//   });
// }


export class ImpulseOutput extends DriverBase<ImpulseOutputProps> {
  private readonly changeEvents = new IndexedEvents<ChangeHandler>();
  private deferredImpulse: boolean = false;
  private blockTimeout: any;
  private impulseTimeout: any;
  private _isInverted: boolean = false;

  private get source(): DigitalIo {
    return this.depsInstances.source;
  }


  init = async () => {
    this._isInverted = isDigitalPinInverted(
      this.props.invert,
      this.props.invertOnOpenDrain,
      this.props.openDrain
    );

    // make rest of props to pass them to the sub driver
    const subDriverProps: {[index: string]: JsonTypes} = omitObj(
      this.props,
      'impulseLength',
      'blockTime',
      'blockMode',
      'invert',
      'invertOnOpenDrain',
      'openDrain',
      'pin',
      'source'
    );

    this.depsInstances.source = this.context.getSubDriver(
      makeDigitalSourceDriverName(this.props.source),
      subDriverProps
    );
  }

  // setup pin after all the drivers has been initialized
  driversDidInit = async () => {
    // TODO: print unique id of sub driver
    this.log.debug(`ImpulseOutput: Setup pin ${this.props.pin} of ${this.props.source}`);

    // resolve initial value
    const initialIoValue = invertIfNeed(false, this.isInverted());

    // setup pin as an input with resistor if specified
    // wait for pin has initialized but don't break initialization on error
    try {
      await this.source.setupOutput(this.props.pin, this.getPinMode(), initialIoValue);
    }
    catch (err) {
      this.log.error(
        `ImpulseOutput: Can't setup pin ${this.props.pin} of ${this.props.source}. ` +
        `"${JSON.stringify(this.props)}": ${err.toString()}`
      );
    }
  }


  getPinMode(): DigitalOutputMode {
    return resolveOutputPinMode(this.props.openDrain);
  }

  isBlocked(): boolean {
    return Boolean(this.blockTimeout);
  }

  isImpulseInProgress(): boolean {
    return Boolean(this.impulseTimeout);
  }

  isInProgress(): boolean {
    return this.isImpulseInProgress() || this.isBlocked();
  }

  isInverted(): boolean {
    return this._isInverted;
  }

  /**
   * Listen to changes which are made in this driver
   */
  onChange(cb: ChangeHandler): number {
    return this.changeEvents.addListener(cb);
  }

  onChangeOnce(cb: ChangeHandler): number {
    return this.changeEvents.once(cb);
  }

  removeListener(handlerIndex: number) {
    this.changeEvents.removeListener(handlerIndex);
  }

  /**
   * Cancel block time but not cancel writing.
   */
  cancel() {
    clearTimeout(this.impulseTimeout);
    clearTimeout(this.blockTimeout);

    delete this.impulseTimeout;
    delete this.blockTimeout;

    this.deferredImpulse = false;
  }

  /**
   * Start impulse
   */
  async impulse(): Promise<void> {
    // skip other changes while block time
    if (this.isBlocked()) return;

    if (this.props.blockMode === 'fixed') {
      // if is "refuse": skip while block time if impulse is in progress
      if (this.isImpulseInProgress()) {
        return;
      }
    }
    else if (this.props.blockMode === 'defer') {
      // mark that there is a deferred impulse and exit
      this.deferredImpulse = true;

      // TODO: return deferred promise
      return;
    }
    else {
      // increase mode
      // TODO: remove current impulse timeout, make new and return promise of it
      return;
    }
    // start the new impulse in case cycle isn't started
    await this.doStartImpulse();
  }


  private async doStartImpulse() {
    const ioValue: boolean = invertIfNeed(true, this.isInverted());

    this.changeEvents.emit(true);

    await this.source.write(invertIfNeed(true, this.props.invert));

    return deferCall<void>(this.impulseFinished, this.props.impulseLength);
  }

  // TODO: review
  private impulseFinished = async () => {
    await this.source.write(invertIfNeed(false, this.props.invert));
    this.impulseInProgress = false;

    this.startBlockTime();
  }

  // TODO: review
  private startBlockTime(): void {
    // if block time isn't set = try to write deferred value if is set
    if (!this.props.blockTime) return this.writeDeferred();

    this.blockTimeInProgress = true;

    setTimeout(() => {
      this.blockTimeInProgress = false;
      this.writeDeferred();
    }, this.props.blockTime);
  }

  // TODO: review
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

}


export default class Factory extends DriverFactoryBase<ImpulseOutput, ImpulseOutputProps> {
  protected SubDriverClass = ImpulseOutput;
  protected instanceId = (props: ImpulseOutputProps): string => {
    const driver: SourceDriverFactoryBase = this.context.getDriver(makeDigitalSourceDriverName(props.source)) as any;

    return generateSubDriverId(props.source, props.pin, driver.generateUniqId(props));
  }
}
