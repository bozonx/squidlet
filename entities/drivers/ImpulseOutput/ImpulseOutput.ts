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
import Promised from '../../../system/lib/Promised';


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


/**
 * Impulse output logic steps:
 * fixed mode:
 * * 0 - nothing is happening
 * * 1 - start impulse for fixed time. Skip any other requests.
 * * 0 - stop impulse
 * blocking. Skip any requests during this time
 *
 * increasing mode:
 * * 0 - nothing is happening
 * * 1 - start impulse for fixed time. Other requests increase impulse time
 * * 0 - stop impulse if there aren't any other requests
 * blocking. Skip any requests during this time
 *
 * defer mode:
 * * 0 - nothing is happening
 * * 1 - start impulse for fixed time. Other requests make new impulse start after that.
 * * 0 - stop impulse
 * blocking. Skip any requests during this time
 * * Start one deferred impulse
 */
export class ImpulseOutput extends DriverBase<ImpulseOutputProps> {
  private readonly changeEvents = new IndexedEvents<ChangeHandler>();
  private deferredImpulse: boolean = false;
  private blockTimeout: any;
  private impulseTimeout: any;
  // promise of writing of the beginning of impulse
  private writingStartPromise?: Promise<any>;
  // promise of writing of the end of impulse
  private writingEndPromise?: Promise<any>;
  private deferredWritePromise?: Promised<void>;
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

    // TODO: get device specified in gpio param
    this.depsInstances.source = this.context.getSubDriver(
      makeDigitalSourceDriverName(this.props.source),
      subDriverProps
    );
  }


  // TODO: use devicesDidInit !!!!
  // setup pin after all the drivers has been initialized
  driversDidInit = async () => {
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

  /**
   * Impulse or writing is in progress.
   */
  isImpulseInProgress(): boolean {
    return Boolean(this.impulseTimeout || this.writingEndPromise || this.writingStartPromise);
  }

  /**
   * Any step is in progress
   */
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

    if (this.deferredWritePromise) this.deferredWritePromise.cancel();

    delete this.deferredWritePromise;
    delete this.impulseTimeout;
    delete this.blockTimeout;

    this.deferredImpulse = false;

    // TODO: проверить как отменится если идет запись
  }

  /**
   * Start impulse
   */
  async impulse(): Promise<void> {
    if (this.props.blockMode === 'increasing') {
      // increasing mode
      if (this.writingEndPromise || this.isBlocked()) {
        // if it is the end of cycle - refuse increasing
        return;
      }
      else if (this.isInProgress()) {
        // if start of impulse is writing or the impulse is in progress > increase mode
        clearTimeout(this.impulseTimeout);
        this.setImpulseTimeout();

        return;
      }
      // else start a new impulse
    }
    else if (this.props.blockMode === 'defer') {
      // if impulse or block time are in progress
      // mark that there is a deferred impulse and return deferred promise
      if (this.isInProgress()) return this.setDeferredValue();
      // else start a new impulse
    }
    else {
      // fixed mode - skip while block time or impulse are in progress
      if (this.isInProgress()) return;
      // else start a new impulse
    }
    // start the new impulse in case cycle isn't started
    await this.doStartImpulse();
  }


  /**
   * Start a new cycle.
   */
  private async doStartImpulse() {
    const ioValue: boolean = invertIfNeed(true, this.isInverted());

    this.setImpulseTimeout();
    this.changeEvents.emit(true);

    this.writingStartPromise = this.source.write(this.props.pin, ioValue);

    try {
      await this.writingStartPromise;
    }
    catch (err) {
      delete this.writingStartPromise;

      // on error cancel deferred queue and start blocking
      const errorMsg = `BinaryOutput driver: Can't write start of impulse,
        props: "${JSON.stringify(this.props)}". ${String(err)}`;

      this.handleError(errorMsg);

      throw new Error(errorMsg);
    }

    delete this.writingStartPromise;
  }

  setImpulseTimeout() {
    this.impulseTimeout = setTimeout(() => {
      this.impulseFinished()
        .catch(this.log.error);
    }, this.props.impulseLength);
  }

  private async impulseFinished() {
    delete this.impulseTimeout;

    // if impulse finished faster than writing of beginning of impulse
    // then wait for writing has been finished
    if (this.writingStartPromise) {
      try {
        await this.writingStartPromise;
      }
      catch (e) {
        // do noting on error because impulse has been cancelled
        return;
      }
    }

    const ioValue: boolean = invertIfNeed(false, this.isInverted());

    this.writingEndPromise = this.source.write(this.props.pin, ioValue);

    try {
      await this.writingEndPromise;
    }
    catch (err) {
      delete this.writingEndPromise;
      // TODO: завершить импульс и запустить block time. Отменить defer
    }

    delete this.writingEndPromise;

    this.startBlocking();
  }

  private startDeferred(): void {
    if (this.props.blockMode !== 'defer' || !this.deferredImpulse) return;
    // start a new impulse if mode is defer and deferred impulse is in the queue

    // clear deferred value
    this.deferredImpulse = false;
    // make deferred impulse
    this.impulse()
    // TODO: what on success?
      .catch((err) => {
        // TODO: review
        this.log.error(`ImpulseOutput: Error with writing deferred impulse: ${String(err)}`);
      });
  }

  private startBlocking(): void {
    if (!this.props.blockTime) return this.startDeferred();

    setTimeout(() => {
      delete this.blockTimeout;
      this.startDeferred();
    }, this.props.blockTime);
  }

  private handleError(errorMsg: string) {
    if (this.deferredWritePromise) {
      this.deferredWritePromise.reject(new Error(errorMsg));

      delete this.deferredWritePromise;
    }

    this.cancel();

    // start blocking
    this.startBlocking();
  }

  private setDeferredValue(): Promise<void> {
    this.deferredImpulse = true;

    // make defer promise if need
    if (!this.deferredWritePromise) {
      this.deferredWritePromise = new Promised<void>();
    }

    return this.deferredWritePromise.promise;
  }

}


export default class Factory extends DriverFactoryBase<ImpulseOutput, ImpulseOutputProps> {
  protected SubDriverClass = ImpulseOutput;
  protected instanceId = (props: ImpulseOutputProps): string => {
    const driver: SourceDriverFactoryBase = this.context.getDriver(makeDigitalSourceDriverName(props.source)) as any;

    return generateSubDriverId(props.source, props.pin, driver.generateUniqId(props));
  }
}
