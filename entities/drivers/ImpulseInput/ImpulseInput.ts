import DigitalIo, {ChangeHandler, DigitalInputMode, Edge} from 'system/interfaces/io/DigitalIo';
import DriverBase from 'system/base/DriverBase';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {omitObj} from 'system/lib/objects';
import {isDigitalPinInverted, resolveEdge} from 'system/lib/helpers';
import SourceDriverFactoryBase from 'system/lib/base/digital/SourceDriverFactoryBase';
import {
  generateSubDriverId,
  makeDigitalSourceDriverName,
  resolveInputPinMode,
} from 'system/lib/base/digital/digitalHelpers';
import DigitalPinInputProps from 'system/lib/base/digital/interfaces/DigitalPinInputProps';
import {JsonTypes} from 'system/interfaces/Types';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';


type RisingHandler = () => void;
type ImpulseInputMode = 'fixed' | 'increasing';


// TODO: edge doesn't supported but it in DigitalPinInputProps
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
  invert?: boolean;
}

enum ImpulseInputEvents {
  rising,
  both
}


/**
 * Impulse logic steps:
 * * 0 - nothing is happening
 * * 1 - started impulse
 * * 0 - impulse ended
 * * 0 - blocking. Skip any inputs during this time.
 * In "increasing" mode impulse will increase by new income changes
 */
export class ImpulseInput extends DriverBase<ImpulseInputProps> {
  private readonly events = new IndexedEventEmitter();
  private blockTimeout: any;
  private impulseTimeout: any;
  private _isInverted: boolean = false;

  private get source(): DigitalIo {
    return this.depsInstances.source;
  }


  init = async () => {
    this._isInverted = isDigitalPinInverted(
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

    const edge: Edge = resolveEdge('rising', this.isInverted());

    // TODO: перезапускать setup время от времени если не удалось инициализировать пин
    // setup pin as an input with resistor if specified
    // wait for pin has initialized but don't break initialization on error
    try {
      // listen to only high levels
      await this.source.setupInput(this.props.pin, this.getPinMode(), this.props.debounce, edge);
    }
    catch (err) {
      this.log.error(
        `ImpulseInput: Can't setup pin. ` +
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

  /**
   * Cancel impulse or block
   */
  cancel() {
    clearTimeout(this.impulseTimeout);
    clearTimeout(this.blockTimeout);

    delete this.impulseTimeout;
    delete this.blockTimeout;
  }


  isImpulseInProgress(): boolean {
    return Boolean(this.impulseTimeout);
  }

  /**
   * Listen only to rising of impulse, not falling.
   */
  onRising(handler: RisingHandler): number {
    return this.events.addListener(ImpulseInputEvents.rising, handler);
  }

  onRisingOnce(handler: RisingHandler): number {
    return this.events.once(ImpulseInputEvents.rising, handler);
  }

  /**
   * Listen to rising and falling of impulse (1 and 0 levels)
   */
  onChange(handler: ChangeHandler): number {
    return this.events.addListener(ImpulseInputEvents.both, handler);
  }

  removeListener(handlerIndex: number) {
    this.events.removeListener(handlerIndex);
  }


  private handleChange = () => {
    // skip other changes while block time
    if (this.isBlocked()) return;

    if (this.props.mode === 'fixed') {
      // skip other changes while current is in progress
      if (this.isImpulseInProgress()) return;

      this.startFixedImpulse();
    }
    else {
      this.startIncreasingImpulse();
    }
  }

  private startFixedImpulse() {
    this.setImpulseTimeout();
    this.events.emit(ImpulseInputEvents.rising);
    this.events.emit(ImpulseInputEvents.both, this.isImpulseInProgress());
  }

  private startIncreasingImpulse() {
    if (this.isImpulseInProgress()) {
      // increase current impulse
      // clear current impulse timeout
      clearTimeout(this.impulseTimeout);
      // set a new impulse timeout
      this.setImpulseTimeout();
    }
    else {
      // start a new one
      this.startFixedImpulse();
    }
  }

  private setImpulseTimeout() {
    this.impulseTimeout = setTimeout(() => {
      delete this.impulseTimeout;

      this.events.emit(ImpulseInputEvents.both, this.isImpulseInProgress());
      // start block time if need
      // if block time isn't set = do nothing
      if (!this.props.blockTime) return;

      this.blockTimeout = setTimeout(() => delete this.blockTimeout, this.props.blockTime);
    }, this.props.impulseLength);
  }

}


export default class Factory extends DriverFactoryBase<ImpulseInput, ImpulseInputProps> {
  protected SubDriverClass = ImpulseInput;
  protected instanceId = (props: ImpulseInputProps): string => {
    const driver: SourceDriverFactoryBase = this.context.getDriver(makeDigitalSourceDriverName(props.source)) as any;

    return generateSubDriverId(props.source, props.pin, driver.generateUniqId(props));
  }
}
