import DriverBase from 'system/base/DriverBase';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {omitObj} from 'system/lib/objects';
import {invertIfNeed, isDigitalPinInverted} from 'system/lib/helpers';
import {BlockMode, JsonTypes} from 'system/interfaces/Types';
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


export interface ImpulseOutputProps extends DigitalPinOutputProps {
  // duration of impulse in ms
  impulseLength: number;
  // in this time driver doesn't receive any data
  blockTime: number;
  // TODO: reivew
  // if "refuse" - it doesn't write while block time.
  // If "defer" it waits for block time finished and write last write request
  // TODO: add increase
  blockMode: BlockMode;
  // when sends 1 actually sends 0 and otherwise
  invert?: boolean;
  // turn value invert if open drain mode is used
  invertOnOpenDrain: boolean;
}


// TODO: review
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
  private readonly changeEvents = new IndexedEvents<ChangeHandler>();
  // TODO: review
  private deferredImpulse: boolean = false;
  // TODO: review
  private impulseInProgress: boolean = false;
  // TODO: use timeout
  private blockTimeInProgress: boolean = false;
  private blockTimeout: any;
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

  isWriting(): boolean {
    // TODO: add
    return this.writing;
  }

  isImpulseInProgress(): boolean {
    // TODO: add
    return Boolean(this.impulseTimeout);
  }

  isInProgress(): boolean {
    return this.isWriting() || this.isBlocked();
  }

  isInverted(): boolean {
    return this._isInverted;
  }

  /**
   * Start impulse
   */
  async impulse(): Promise<void> {
    // TODO: review
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

    await this.source.write(invertIfNeed(true, this.props.invert));

    return deferCall<void>(this.impulseFinished, this.props.impulseLength);
  }


  private impulseFinished = async () => {
    await this.source.write(invertIfNeed(false, this.props.invert));
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
  protected instanceId = (props: ImpulseOutputProps): string => {
    const driver: SourceDriverFactoryBase = this.context.getDriver(makeDigitalSourceDriverName(props.source)) as any;

    return generateSubDriverId(props.source, props.pin, driver.generateUniqId(props));
  }
}
