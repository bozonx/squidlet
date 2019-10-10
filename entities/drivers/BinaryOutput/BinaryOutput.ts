import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import IndexedEvents from 'system/lib/IndexedEvents';
import {omitObj} from 'system/lib/objects';
import {resolveLevel, invertIfNeed, isDigitalPinInverted} from 'system/lib/helpers';
import {BlockMode, InitialLevel, JsonTypes} from 'system/interfaces/Types';
import SourceDriverFactoryBase from 'system/lib/base/digital/SourceDriverFactoryBase';
import {generateSubDriverId, makeDigitalSourceDriverName} from 'system/lib/base/digital/digitalHelpers';
import DigitalIo, {ChangeHandler} from 'system/interfaces/io/DigitalIo';
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
 * * writing sroted value
 * * blocking. Skip any requests during this time
 */
export class BinaryOutput extends DriverBase<BinaryOutputProps> {
  private readonly changeEvents = new IndexedEvents<ChangeHandler>();
  private deferredWritePromise?: Promised<void>;
  private lastDeferredValue?: boolean;
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

    const initialValue: boolean = this.resolveInitialLevel();

    // TODO: перезапускать setup время от времени если не удалось инициализировать пин
    // setup pin as an input with resistor if specified
    // wait for pin has initialized but don't break initialization on error
    try {
      await this.source.setupOutput(this.props.pin, initialValue);
    }
    catch (err) {
      this.log.error(
        `BinaryOutput: Can't setup pin. ` +
        `"${JSON.stringify(this.props)}": ${err.toString()}`
      );
    }
  }


  // TODO: Выяснить будут ли подниматься события в IO если пин output
  // TODO: !!! если пропала связь то сделать дополнительный запрос текущего состояния


  isBlocked(): boolean {
    return Boolean(this.blockTimeout);
  }

  isInverted(): boolean {
    return this._isInverted;
  }

  async read(): Promise<boolean> {
    const realValue: boolean = await this.source.read(this.props.pin);

    // TODO: поднимать событие если значение изменилось

    return invertIfNeed(realValue, this.isInverted());
  }

  async write(level: boolean): Promise<void> {
    // TODO: поднимать событие если значение изменилось

    // TODO: проверитьчто не только заблокировнно, но и идет запись

    if (this.isBlocked()) {
      // TODO: проверять ещё и в режиме записи
      // try to write while another write is in progress
      if (this.props.blockMode === 'refuse') {
        // don't allow writing while block time is in progress in "refuse" mode
        return;
      }

      // else defer mode - store value to write after current writing and make promise
      return this.setDeferredValue(level);
    }

    // normal write only if there isn't blocking
    return this.doWrite(level);
  }

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
    const resolvedValue: boolean = invertIfNeed(level, this.isInverted());

    // use blocking if there is set blockTime prop
    if (this.props.blockTime) {
      // starting blocking
      this.blockTimeout = setTimeout(this.blockTimeFinished, this.props.blockTime);
    }

    // TODO: сохранить индикатор что идет запись

    try {
      await this.source.write(this.props.pin, resolvedValue);
    }
    catch (err) {

      // TODO: что делать с отложенным значением? - наверное очистить

      // TODO: блокировка всеравно будет даже если не удалось записать ???
      clearTimeout(this.blockTimeout);

      delete this.blockTimeout;

      const errorMsg = `BinaryOutputDriver: Can't write "${level}",
        props: "${JSON.stringify(this.props)}". ${String(err)}`;

      // TODO: review
      if (this.deferredWritePromise) this.deferredWritePromise.reject(new Error(errorMsg));

      throw new Error(errorMsg);
    }
  }

  private blockTimeFinished = () => {
    delete this.blockTimeout;

    // TODO: убедиться что lastDeferredValue и deferredWritePromise гарантированно очищается
    // TODO: проверить что должно идти по кругу если каждый раз задаются deferred value

    // writing last delayed value if set
    if (this.props.blockMode === 'defer' && typeof this.lastDeferredValue !== 'undefined') {
      const resolvedValue: boolean = invertIfNeed(this.lastDeferredValue, this.isInverted());
      // clear deferred value
      this.lastDeferredValue = undefined;
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
  }

  /**
   * Wait for deferred value has been written.
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
