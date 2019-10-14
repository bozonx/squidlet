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
  private writingPromise?: Promise<any>;
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

    // TODO: проверить как отменится если идет запись
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
      // TODO: если идет финальная запись 0 то отклонять increase
      return;
    }
    // start the new impulse in case cycle isn't started
    await this.doStartImpulse();
  }


  private async doStartImpulse() {
    const ioValue: boolean = invertIfNeed(true, this.isInverted());

    this.changeEvents.emit(true);

    this.impulseTimeout = setTimeout(() => {
      this.impulseFinished()
        .catch(this.log.error);
    }, this.props.impulseLength);
    this.writingPromise = this.source.write(this.props.pin, ioValue);

    try {
      await this.writingPromise;
    }
    catch (err) {
      delete this.writingPromise;
      // TODO: !!!! поидее нужно все отменить
    }

    delete this.writingPromise;
  }

  private async impulseFinished() {
    // TODO: отменить возможность продления импульса ????

    // if impulse finished faster than writing of beginning of impulse
    // then wait for writing has been finished
    if (this.writingPromise) {
      try {
        await this.writingPromise;
      }
      catch (e) {
        // TODO: что делать в случае ошибки?? наверное ничего
        return;
      }
    }

    delete this.impulseTimeout;

    const ioValue: boolean = invertIfNeed(false, this.isInverted());

    // TODO: неопределенное состояние пока идет запись
    //  * либо добавить новое состояние
    //  * либо продлить импульс
    //  * либо запустить blockTime

    try {
      await this.source.write(this.props.pin, ioValue);
    }
    catch (err) {
      // TODO: завершить импульс и запустить block time. Отменить defer
    }

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
    this.deferredImpulse = false;
    // make deferred impulse
    this.impulse()
    // TODO: what on success?
      .catch((err) => {
        // TODO: review
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
