import DigitalOutputIo from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/DigitalOutputIo';

type Timeout = NodeJS.Timeout;
import DriverBase from 'src/base/DriverBase';
import DriverFactoryBase from 'src/base/DriverFactoryBase';
import {invertIfNeed, isDigitalPinInverted} from '../squidlet-lib/src/digitalHelpers';
import {resolveOutputResistorMode} from '../squidlet-lib/src/digitalHelpers';
import IndexedEvents from '../squidlet-lib/src/IndexedEvents';
import DigitalPinOutputProps from '__old/system/interfaces/DigitalPinOutputProps';
import Promised from '../squidlet-lib/src/Promised';
import {OutputResistorMode} from '__old/system/interfaces/gpioTypes';
import DeviceBase from '__old/system/base/DeviceBase';


type ImpulseOutputMode = 'fixed' | 'defer' | 'increasing';
export type ChangeHandler = (level: boolean) => void;


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


// TODO: можно ли тут использовать debounce с пролонгацией?


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
 *
 * On error while writing the state of impulse the cycle will be cancelled and a block time will be started.
 */
export class ImpulseOutput extends DriverBase<ImpulseOutputProps> {
  private readonly changeEvents = new IndexedEvents<ChangeHandler>();
  private deferredImpulse?: boolean;
  private blockTimeout?: Timeout;
  private impulseTimeout?: Timeout;
  // promise of writing of the beginning of impulse
  private writingStartPromise?: Promise<any>;
  // promise of writing of the end of impulse
  private writingEndPromise?: Promise<any>;
  private deferredWritePromise?: Promised<void>;
  private _isInverted: boolean = false;
  private digitalOutputIo!: DigitalOutputIo;


  init = async () => {
    this._isInverted = isDigitalPinInverted(
      this.props.invert,
      this.props.invertOnOpenDrain,
      this.props.openDrain
    );

    this.digitalOutputIo = this.context.getIo('DigitalOutput', this.props.ioSet);
  }

  protected async servicesDidInit?(): Promise<void> {
    this.handleGpioInit()
      .catch(this.log.error);
  }


  // setup pin after all the devices has been initialized
  handleGpioInit = async () => {
    this.log.debug(`ImpulseOutput: Setup pin ${this.props.pin} of ${this.props.ioSet}`);

    // resolve initial value
    const initialIoValue = invertIfNeed(false, this.isInverted());

    // setup pin as an input with resistor if specified
    // wait for pin has initialized but don't break initialization on error
    try {
      await this.digitalOutputIo.setup(
        this.props.pin,
        initialIoValue,
        this.getResistorMode()
      );
    }
    catch (err) {
      this.log.error(
        `ImpulseOutput: Can't setup pin ${this.props.pin} of ${this.props.ioSet}. ` +
        `"${JSON.stringify(this.props)}": ${err.toString()}`
      );
    }
  }


  getResistorMode(): OutputResistorMode {
    return resolveOutputResistorMode(this.props.openDrain);
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
    if (this.impulseTimeout) clearTimeout(this.impulseTimeout);
    if (this.blockTimeout) clearTimeout(this.blockTimeout);
    // TODO: better to resolve
    if (this.deferredWritePromise) this.deferredWritePromise.cancel();

    delete this.deferredWritePromise;
    delete this.impulseTimeout;
    delete this.blockTimeout;
    delete this.deferredImpulse;

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
        if (this.impulseTimeout) clearTimeout(this.impulseTimeout);

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

    this.writingStartPromise = this.digitalOutputIo.write(this.props.pin, ioValue);

    try {
      await this.writingStartPromise;
    }
    catch (err) {
      delete this.writingStartPromise;

      // on error cancel deferred queue and start blocking
      const errorMsg = `ImpulseOutput driver: Can't write start of impulse,
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

    this.writingEndPromise = this.digitalOutputIo.write(this.props.pin, ioValue);

    try {
      await this.writingEndPromise;
    }
    catch (err) {
      delete this.writingEndPromise;

      const errorMsg = `ImpulseOutput driver: Can't write end of impulse,
        props: "${JSON.stringify(this.props)}". ${String(err)}`;

      this.handleError(errorMsg);
    }

    delete this.writingEndPromise;

    this.startBlocking();
  }

  private startBlocking(): void {
    if (!this.props.blockTime) return this.startDeferred();

    setTimeout(() => {
      delete this.blockTimeout;
      this.startDeferred();
    }, this.props.blockTime);
  }

  private startDeferred(): void {
    if (this.props.blockMode !== 'defer' || !this.deferredImpulse) return;
    // start a new impulse if mode is defer and deferred impulse is in the queue
    // clear deferred value
    delete this.deferredImpulse;
    // make deferred impulse

    let deferredWritePromise: Promised<void> | undefined;

    if (this.deferredWritePromise) {
      deferredWritePromise = this.deferredWritePromise;

      delete this.deferredWritePromise;
    }

    this.impulse()
      .then(() => {
        if (deferredWritePromise) deferredWritePromise.resolve();
      })
      .catch((err) => {
        if (deferredWritePromise) deferredWritePromise.reject(err);
      });
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
    return `${props.ioSet}${props.pin}`;
  }
}
