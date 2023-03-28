type Timeout = NodeJS.Timeout;
import DriverFactoryBase from 'src/base/DriverFactoryBase';
import DriverBase from 'src/base/DriverBase';
import IndexedEvents from '../squidlet-lib/src/IndexedEvents';
import {resolveLevel, invertIfNeed, isDigitalPinInverted} from '../squidlet-lib/src/digitalHelpers';
import {InitialLevel} from '../squidlet-lib/src/interfaces/Types';
import {resolveOutputResistorMode} from '../squidlet-lib/src/digitalHelpers';
import DigitalPinOutputProps from '__old/system/interfaces/DigitalPinOutputProps';
import Promised from '../squidlet-lib/src/Promised';
import {OutputResistorMode} from '__old/system/interfaces/gpioTypes';
import DeviceBase from '__old/system/base/DeviceBase';
import DigitalOutputIo from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/DigitalOutputIo';


export type BlockMode = 'refuse' | 'defer';
export type ChangeHandler = (level: boolean) => void;


export interface BinaryOutputProps extends DigitalPinOutputProps {
  blockTime?: number;
  // if "refuse" - it doesn't write while block time is in progress. It is on default.
  // If "defer" it waits for block time finished and write last value which was tried to set.
  //   It's a simple queue
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
  private writing: boolean = false;
  private deferredWritePromise?: Promised<void>;
  // last value witch will be written after current writing in deferred mode.
  // It represent a top level driver's value (not IO's).
  // It hast to be inverted to be written to IO if invert is set
  private lastDeferredValue?: boolean;
  // last not inverted value which is represent value of IO
  private currentIoValue?: boolean;
  private blockTimeout?: Timeout;
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


  // setup pin after all the drivers has been initialized
  handleGpioInit = async () => {
    this.log.debug(`BinaryOutput: Setup pin ${this.props.pin} of ${this.props.ioSet}`);

    // set initial value
    this.currentIoValue = this.resolveInitialLevel();

    // setup pin as an input with resistor if specified
    // wait for pin has initialized but don't break initialization on error
    try {
      await this.digitalOutputIo.setup(
        this.props.pin,
        this.currentIoValue,
        this.getResistorMode()
      );
    }
    catch (err) {
      this.log.error(
        `BinaryOutput: Can't setup pin ${this.props.pin} of ${this.props.ioSet}. ` +
        `"${JSON.stringify(this.props)}": ${err.toString()}`
      );
    }
  }

  getResistorMode(): OutputResistorMode {
    return resolveOutputResistorMode(this.props.openDrain);
  }

  // async getPinResistorMode(pin: number): Promise<OutputResistorMode | undefined> {
  //   //return this.logic.getPinResistorMode(pin) as OutputResistorMode | undefined;
  // }

  // // output and input pins can be read
  // read(pin: number): Promise<boolean>;

  isBlocked(): boolean {
    return Boolean(this.blockTimeout);
  }

  isWriting(): boolean {
    return this.writing;
  }

  isInProgress(): boolean {
    return this.isWriting() || this.isBlocked();
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
    if (this.blockTimeout) clearTimeout(this.blockTimeout);

    // TODO: better to resolve
    if (this.deferredWritePromise) this.deferredWritePromise.cancel();

    delete this.deferredWritePromise;
    delete this.blockTimeout;
    delete this.lastDeferredValue;

    this.writing = false;

    // TODO: что должно быть с currentIoValue - не трогать или вернуть к предыдущему значению ??
    // TODO: проверить как отменится если идет запись
  }

  /**
   * Read from IO and rise event if need.
   */
  async read(): Promise<boolean> {
    // TODO: зачем тут read ????
    const ioValue: boolean = await this.digitalOutputIo.read(this.props.pin);

    return invertIfNeed(ioValue, this.isInverted());
  }

  /**
   * Read value from IO
   */
  async poll(): Promise<void> {
    // TODO: зачем read ???
    const ioValue: boolean = await this.digitalOutputIo.read(this.props.pin);

    // update current value and emit change event if need
    if (this.currentIoValue !== ioValue) {
      const resolvedValue: boolean = invertIfNeed(ioValue, this.isInverted());

      this.currentIoValue = ioValue;

      this.changeEvents.emit(resolvedValue);
    }
  }

  /**
   * Write value to IO
   * @param level - top level value
   */
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
    await this.doWrite(level);

    this.handleSuccessWriting();
  }


  private async doWrite(level: boolean) {
    const ioValue: boolean = invertIfNeed(level, this.isInverted());

    // update current value and emit change event if need
    if (this.currentIoValue !== ioValue) {
      this.currentIoValue = ioValue;
      // emit top level value
      this.changeEvents.emit(level);
    }

    this.writing = true;

    // wait for writing
    try {
      await this.digitalOutputIo.write(this.props.pin, ioValue);
    }
    catch (err) {
      this.writing = false;
      // on error cancel deferred queue and start blocking
      const errorMsg = `BinaryOutput driver: Can't write "${level}",
        props: "${JSON.stringify(this.props)}". ${String(err)}`;

      this.handleError(errorMsg);

      throw new Error(errorMsg);
    }

    this.writing = false;
  }

  private handleSuccessWriting() {
    // if deferred mode and there is deferred value and it different than current value then write it
    if (
      this.props.blockMode === 'defer'
      && typeof this.lastDeferredValue !== 'undefined'
      && invertIfNeed(this.lastDeferredValue, this.isInverted()) !== this.currentIoValue
    ) {
      this.startDeferred();

      return;
    }
    // else start just blocking and after that cycle has been ended
    this.startBlocking();
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

  private startDeferred() {
    const level: boolean = Boolean(this.lastDeferredValue);
    // clear deferred value
    delete this.lastDeferredValue;

    let deferredWritePromise: Promised<void> | undefined;

    if (this.deferredWritePromise) {
      deferredWritePromise = this.deferredWritePromise;

      delete this.deferredWritePromise;
    }

    // write deferred value, don't wait for it has been finished
    this.doWrite(level)
      .then(() => {
        if (deferredWritePromise) deferredWritePromise.resolve();

        this.handleSuccessWriting();
      })
      .catch((e: Error) => {
        if (deferredWritePromise) deferredWritePromise.reject(e);
      });
  }

  /**
   * Set deferred value ans wait for it has been written.
   */
  private setDeferredValue(level: boolean): Promise<void> {
    // store top level value which will be written after current has finished
    this.lastDeferredValue = level;

    // make defer promise if need
    if (!this.deferredWritePromise) {
      this.deferredWritePromise = new Promised<void>();
    }

    return this.deferredWritePromise.promise;
  }

  private startBlocking() {
    if (!this.props.blockTime) return;

    this.blockTimeout = setTimeout(() => delete this.blockTimeout, this.props.blockTime);
  }

  private resolveInitialLevel(): boolean {
    const resolvedLevel: boolean = resolveLevel(this.props.initial);

    return invertIfNeed(resolvedLevel, this.isInverted());
  }

}


export default class Factory extends DriverFactoryBase<BinaryOutput, BinaryOutputProps> {
  protected SubDriverClass = BinaryOutput;
  protected instanceId = (props: BinaryOutputProps): string => {
    return `${props.ioSet}${props.pin}`;
  }
}
