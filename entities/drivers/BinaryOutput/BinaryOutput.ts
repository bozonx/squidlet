import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import IndexedEvents from 'system/lib/IndexedEvents';
import {omitObj} from 'system/lib/objects';
import {resolveLevel, invertIfNeed, isDigitalPinInverted} from 'system/lib/helpers';
import {BlockMode, InitialLevel, JsonTypes} from 'system/interfaces/Types';
import SourceDriverFactoryBase from 'system/lib/base/digital/SourceDriverFactoryBase';
import {
  generateSubDriverId,
  makeDigitalSourceDriverName,
  resolveOutputPinMode,
} from 'system/lib/base/digital/digitalHelpers';
import DigitalIo, {ChangeHandler, DigitalInputMode, DigitalOutputMode} from 'system/interfaces/io/DigitalIo';
import DigitalPinOutputProps from 'system/lib/base/digital/interfaces/DigitalPinOutputProps';
import Promised from 'system/lib/Promised';


type DelayedResultHandler = (err?: Error) => void;

export interface BinaryOutputProps extends DigitalPinOutputProps {
  blockTime?: number;
  // if "refuse" - it doesn't write while block time is in progress. It is on default.
  // If "defer" it waits for block time finished and write last value which was tried to set
  blockMode: BlockMode;
  // when sends 1 actually sends 0 and otherwise
  invert?: boolean;
  // turn value invert if open drain mode is used
  invertOnOpenDrain: boolean;
  // driver's initial, will be resolved to be sent to IO
  initial: InitialLevel;
}


/**
 * Binary output logic steps:
 * refuse mode:
 * * 0 - nothing is happening
 * * 1 - level is set high. writing. Other requests are refused
 * * 1 - blocking. Skip any requests during this time too
 *
 * defer mode:
 * * 0 - nothing is happening
 * * 1 - level is set high. writing. The value of the last request is stored to write it later.
 * * writing value deferred value if it was set
 * * blocking. Skip any requests during this time
 *
 * If there was error while writing in deferred mode then cycle will be cancelled
 * but blocking will be started.
 */
export class BinaryOutput extends DriverBase<BinaryOutputProps> {
  private readonly changeEvents = new IndexedEvents<ChangeHandler>();
  // TODO: зачем сохранять промис может тогда лучше просто boolean
  private writingPromise?: Promise<void>;
  private deferredWritePromise?: Promised<void>;
  private lastDeferredValue?: boolean;
  // last not inverted value which is represent value of IO
  private currentIoValue?: boolean;
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
      'blockTime',
      'blockMode',
      'invert',
      'invertOnOpenDrain',
      'initial',
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
    this.log.debug(`BinaryOutput: Setup pin ${this.props.pin} of ${this.props.source}`);

    // set initial value
    this.currentIoValue = this.resolveInitialLevel();

    // TODO: перезапускать setup время от времени если не удалось инициализировать пин
    // setup pin as an input with resistor if specified
    // wait for pin has initialized but don't break initialization on error
    try {
      await this.source.setupOutput(this.props.pin, this.getPinMode(), this.currentIoValue);
    }
    catch (err) {
      this.log.error(
        `BinaryOutput: Can't setup pin. ` +
        `"${JSON.stringify(this.props)}": ${err.toString()}`
      );
    }
  }


  // TODO: !!! если пропала связь то сделать дополнительный запрос текущего состояния

  getPinMode(): DigitalOutputMode {
    return resolveOutputPinMode(this.props.openDrain);
  }

  isBlocked(): boolean {
    return Boolean(this.blockTimeout);
  }

  isWriting(): boolean {
    return Boolean(this.writingPromise);
  }

  isInProgress(): boolean {
    return this.isWriting() || this.isBlocked();
  }

  isInverted(): boolean {
    return this._isInverted;
  }

  async read(): Promise<boolean> {
    const ioValue: boolean = await this.source.read(this.props.pin);

    // update current value and emit change event if need
    if (this.currentIoValue !== ioValue) {
      this.currentIoValue = ioValue;

      this.changeEvents.emit(ioValue);
    }

    return invertIfNeed(ioValue, this.isInverted());
  }

  async write(level: boolean): Promise<void> {
    // if there is writing or blocking check block modes
    if (this.isInProgress()) {
      // don't allow writing while another writing or block time is in progress in "refuse" mode
      if (this.props.blockMode === 'refuse') return;
      // else defer mode - store value to write after current writing has been completed
      // and wait for defer write has been completed.
      return this.setDeferredValue(level);
    }
    // normally write only if there isn't writing or blocking in progress
    return this.doWrite(level);
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
    clearTimeout(this.blockTimeout);

    delete this.blockTimeout;
  }


  private async doWrite(level: boolean) {
    const ioValue: boolean = invertIfNeed(level, this.isInverted());

    // update current value and emit change event if need
    if (this.currentIoValue !== ioValue) {
      this.currentIoValue = ioValue;

      this.changeEvents.emit(ioValue);
    }

    // save writing promise
    this.writingPromise = this.source.write(this.props.pin, ioValue);

    // wait for it
    try {
      await this.writingPromise;
    }
    catch (err) {
      // on error cancel deferred queue and start blocking
      const errorMsg = `BinaryOutput driver: Can't write "${level}",
        props: "${JSON.stringify(this.props)}". ${String(err)}`;

      this.handleError(errorMsg);

      throw new Error(errorMsg);
    }

    // if deferred mode and there is deferred value then write it
    if (this.props.blockMode === 'defer' && typeof this.lastDeferredValue !== 'undefined') {
      return this.startDeferredWrite();
    }
    // else start just blocking and after that cycle has been ended
    this.startBlocking();
  }

  private handleError(errorMsg: string) {
    // removing deferred and make deferred promise rejected
    delete this.lastDeferredValue;

    if (this.deferredWritePromise) {
      this.deferredWritePromise.reject(new Error(errorMsg));

      delete this.deferredWritePromise;
    }

    // start blocking
    this.startBlocking();
  }

  private startBlocking() {
    // use blocking if there is blockTime prop
    if (this.props.blockTime) {
      // starting blocking
      this.blockTimeout = setTimeout(this.blockTimeFinished, this.props.blockTime);
    }
  }

  private startDeferredWrite() {
    const resolvedValue: boolean = invertIfNeed(this.lastDeferredValue, this.isInverted());
    // clear deferred value
    delete this.lastDeferredValue;
    // write deferred value
    // don't wait in normal way
    this.doWrite(resolvedValue)
      .then(() => {
        if (this.deferredWritePromise) this.deferredWritePromise.resolve();
      })
      .catch((err) => {
        if (this.deferredWritePromise) this.deferredWritePromise.reject(err);
      });
  }

  private blockTimeFinished = () => {
    delete this.blockTimeout;

    // TODO: убедиться что lastDeferredValue и deferredWritePromise гарантированно очищается
    // TODO: проверить что должно идти по кругу если каждый раз задаются deferred value

    // writing last delayed value if set
    if (this.props.blockMode === 'defer' && typeof this.lastDeferredValue !== 'undefined') {

    }
  }

  /**
   * Set deferred value ans wait for it has been written.
   */
  private setDeferredValue(level: boolean): Promise<void> {
    // store level which will be written after current has finished
    this.lastDeferredValue = level;

    // make defer promise
    if (!this.deferredWritePromise) {
      this.deferredWritePromise = new Promised<void>();
    }

    return this.deferredWritePromise.promise;
  }

  private resolveInitialLevel(): boolean {
    const resolvedLevel: boolean = resolveLevel(this.props.initial);

    return invertIfNeed(resolvedLevel, this.isInverted());
  }

}


export default class Factory extends DriverFactoryBase<BinaryOutput, BinaryOutputProps> {
  protected SubDriverClass = BinaryOutput;
  protected instanceId = (props: BinaryOutputProps): string => {
    const driver: SourceDriverFactoryBase = this.context.getDriver(makeDigitalSourceDriverName(props.source)) as any;

    return generateSubDriverId(props.source, props.pin, driver.generateUniqId(props));
  }
}
