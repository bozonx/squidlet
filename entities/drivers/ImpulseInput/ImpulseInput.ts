import DigitalIo, {ChangeHandler, DigitalInputMode} from 'system/interfaces/io/DigitalIo';
import DriverBase from 'system/base/DriverBase';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {omitObj} from 'system/lib/objects';
import {isDigitalInputInverted} from 'system/lib/helpers';
import SourceDriverFactoryBase from 'system/lib/base/digital/SourceDriverFactoryBase';
import {
  generateSubDriverId,
  makeDigitalSourceDriverName,
  resolveInputPinMode,
} from 'system/lib/base/digital/digitalHelpers';
import DigitalPinInputProps from 'system/lib/base/digital/interfaces/DigitalPinInputProps';
import {JsonTypes} from 'system/interfaces/Types';
import IndexedEventEmitter from '../../../system/lib/IndexedEventEmitter';


type RisingHandler = () => void;
type ImpulseInputMode = 'fixed' | 'increasing';

// TODO: reivew
// TODO: reivew in manifest
export interface ImpulseInputProps extends DigitalPinInputProps {
  // duration of impulse in ms
  impulseLength: number;
  // in this time driver doesn't receive any data
  blockTime: number;

  mode: ImpulseInputMode;
  // auto invert if pullup resistor is set. Default is true
  invertOnPullup: boolean;
  // for input: when receives 1 actually returned 0 and otherwise
  // for output: when sends 1 actually sends 0 and otherwise
  invert: boolean;
}

enum ImpulseInputEvents {
  rising,
  both
}


// TODO: add doc
export class ImpulseInput extends DriverBase<ImpulseInputProps> {
  private readonly events = new IndexedEventEmitter();
  private blockTimeout: any;
  private impulseTimeout: any;
  // TODO: review
  private _isInverted: boolean = false;

  private get source(): DigitalIo {
    return this.depsInstances.source;
  }


  init = async () => {
    this._isInverted = isDigitalInputInverted(
      this.props.invert,
      this.props.invertOnPullup,
      this.props.pullup
    );

    const subDriverProps: {[index: string]: JsonTypes} = omitObj(
      this.props,
      'impulseLength',
      'blockTime',
      'mode',
      'invert',
      'invertOnPullup',
      // TODO: review edge
      // it doesn't supported in props
      //'edge',
      'debounce',
      'pullup',
      'pulldown',
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
    this.log.debug(`ImpulseInput: Setup pin ${this.props.pin} of ${this.props.source}`);

    // TODO: перезапускать setup время от времени если не удалось инициализировать пин
    // setup pin as an input with resistor if specified
    // wait for pin has initialized but don't break initialization on error
    try {
      // TODO: review edge
      await this.source.setupInput(this.props.pin, this.getPinMode(), this.props.debounce, 'both');
    }
    catch (err) {
      this.log.error(
        `BinaryInput: Can't setup pin. ` +
        `"${JSON.stringify(this.props)}": ${err.toString()}`
      );
    }

    // TODO: поидее надо разрешить слушать пин даже если он ещё не проинициализировался ???
    await this.source.addListener(this.props.pin, this.handleChange);
  }


  // TODO: лучше отдавать режим резистора, так как режим пина и так понятен
  getPinMode(): DigitalInputMode {
    return resolveInputPinMode(this.props.pullup, this.props.pulldown);
  }

  isBlocked(): boolean {
    return Boolean(this.blockTimeout);
  }

  /**
   * If changes from IO comes inverted
   */
  isInverted(): boolean {
    return this._isInverted;
  }

  // TODO: add cancel blocking
  // TODO: add cancel impulse


  async isImpulseInProgress(): Promise<boolean> {
    return Boolean(this.impulseTimeout);
  }

  /**
   * Listen only to rising of impulse, not falling.
   */
  addRisingListener(handler: RisingHandler): number {
    return this.events.addListener(ImpulseInputEvents.rising, handler);
  }

  listenRisingOnce(handler: RisingHandler): number {
    return this.events.once(ImpulseInputEvents.rising, handler);
  }

  /**
   * Listen to rising and falling of impulse (1 and 0 levels)
   */
  addListener(handler: ChangeHandler): number {
    return this.events.addListener(ImpulseInputEvents.both, handler);
  }

  removeListener(handlerIndex: number) {
    this.events.removeListener(handlerIndex);
  }


  private handleChange = () => {
    // skip other changes while current is in progress
    if (this.impulseInProgress || this.isBlocked()) return;

    if (this.props.mode === 'fixed') {
      this.startFixedImpulse();
    }
    else {
      this.startIncreasingImpulse();
    }
  }

  private startFixedImpulse() {
    // TODO: наверное события запустить после таймаута чтобы на момент события правилно определился стейт
    this.events.emit(ImpulseInputEvents.rising);
    this.events.emit(ImpulseInputEvents.both, this.isImpulseInProgress());

    this.impulseTimeout = setTimeout(() => {
      delete this.impulseTimeout;

      this.events.emit(ImpulseInputEvents.both, this.isImpulseInProgress());

      // start block time if need
      this.startBlockTime();
    }, this.props.impulseLength);
  }

  private startIncreasingImpulse() {
    this.events.emit(ImpulseInputEvents.rising);
    this.events.emit(ImpulseInputEvents.both, this.isImpulseInProgress());

    // TODO: add
  }

  // private throttle(): void {
  //   this.throttleInProgress = true;
  //
  //   // waiting and then read level
  //   setTimeout(async () => {
  //     const currentValue: boolean = await this.digitalInput.read();
  //
  //     this.throttleInProgress = false;
  //
  //     // if level is 0 - it isn't an impulse - do nothing
  //     if (!currentValue) return;
  //
  //     this.startImpulse();
  //   }, Number(this.props.throttle));
  // }

  private startBlockTime(): void {
    // if block time isn't set = do nothing
    if (!this.props.blockTime) return;

    this.blockTimeInProgress = true;

    this.blockTimeout = setTimeout(() => {
      this.blockTimeInProgress = false;
    }, this.props.blockTime);
  }

}


export default class Factory extends DriverFactoryBase<ImpulseInput, ImpulseInputProps> {
  protected SubDriverClass = ImpulseInput;
  protected instanceId = (props: ImpulseInputProps): string => {
    const driver: SourceDriverFactoryBase = this.context.getDriver(makeDigitalSourceDriverName(props.source)) as any;

    return generateSubDriverId(props.source, props.pin, driver.generateUniqId(props));
  }
}
