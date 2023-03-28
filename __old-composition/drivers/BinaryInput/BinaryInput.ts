type Timeout = NodeJS.Timeout;
import IndexedEvents from '../squidlet-lib/src/IndexedEvents';
import DriverFactoryBase from 'src/base/DriverFactoryBase';
import DigitalInputIo, {ChangeHandler} from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/DigitalInputIo';
import {invertIfNeed, isDigitalPinInverted, resolveEdge} from '../squidlet-lib/src/digitalHelpers';
import {resolveInputResistorMode} from '../squidlet-lib/src/digitalHelpers';
import DigitalPinInputProps from '__old/system/interfaces/DigitalPinInputProps';
import DriverBase from 'src/base/DriverBase';
import {Edge, InputResistorMode} from '__old/system/interfaces/gpioTypes';


export interface BinaryInputProps extends DigitalPinInputProps {
  // in this time driver doesn't receive any data.
  // it is optional. If doesn't set then the change event will be emit as soon as value is changed
  // but if value actually not equals the last one.
  blockTime?: number;
  // when receives 1 actually returned 0 and otherwise
  invert?: boolean;
  // auto invert if pullup resistor is set. Default is true
  invertOnPullup: boolean;
}


/**
 * Simple binary logic. Steps:
 * * 0 - nothing is happening
 * * 1 - level is high
 * * 1 - blocking. Skip any inputs during this time.
 */
export class BinaryInput extends DriverBase<BinaryInputProps> {
  private readonly changeEvents = new IndexedEvents<ChangeHandler>();
  // last not inverted level represent level of board's pin
  private lastIoLevel?: boolean;
  // has value to be inverted when change event is rising
  private _isInverted: boolean = false;
  private blockTimeout?: Timeout;
  private digitalInputIo!: DigitalInputIo;


  init = async () => {
    this._isInverted = isDigitalPinInverted(
      this.props.invert,
      this.props.invertOnPullup,
      this.props.pullup
    );

    this.digitalInputIo = this.context.getIo('DigitalInput', this.props.ioSet);
  }

  protected async servicesDidInit?(): Promise<void> {
    this.handleGpioInit()
      .catch(this.log.error);
  }


  // setup pin after all the drivers has been initialized
  handleGpioInit = async () => {
    const edge: Edge = resolveEdge(this.props.edge, this._isInverted);

    this.log.debug(`BinaryInput: Setup pin ${this.props.pin} of ${this.props.ioSet}`);

    // setup pin as an input with resistor if specified
    // wait for pin has initialized but don't break initialization on error
    try {
      // TODO: debounce and edge могут быть undefined чтобы можно было переопределить в Gpio device

      await this.digitalInputIo.setup(
        this.props.pin,
        this.getResistorMode(),
        this.props.debounce,
        edge
      );
    }
    catch (err) {
      this.log.error(
        `BinaryInput ${this.props.pin} of ${this.props.ioSet}: Can't setup pin. ` +
        `"${JSON.stringify(this.props)}": ${err.toString()}`
      );
    }

    await this.digitalInputIo.onChange(this.props.pin, this.handleChange);
  }


  getResistorMode(): InputResistorMode {
    return resolveInputResistorMode(this.props.pullup, this.props.pulldown);
  }

  isBlocked(): boolean {
    return Boolean(this.blockTimeout);
  }

  isInverted(): boolean {
    return this._isInverted;
  }

  /**
   * Just read and return a value
   */
  read(): Promise<boolean> {
    return this.digitalInputIo.read(this.props.pin);
  }

  /**
   * Read from IO and rise event if need.
   */
  async poll(): Promise<void> {
    const level = await this.digitalInputIo.read(this.props.pin);

    if (level !== this.lastIoLevel) {
      // save last level to compare next time
      this.lastIoLevel = level;
      // rise event if level is changed
      // emit event and invert the value if need
      this.changeEvents.emit(invertIfNeed(level, this.isInverted()));
    }
  }

  /**
   * Listen to rising and falling of impulse (1 and 0 levels).
   * The value will be inverted if it required.
   */
  onChange(handler: ChangeHandler): number {
    return this.changeEvents.addListener(handler);
  }

  onChangeOnce(handler: ChangeHandler): number {
    return this.changeEvents.once(handler);
  }

  removeListener(handlerIndex: number) {
    this.changeEvents.removeListener(handlerIndex);
  }

  /**
   * Cancel blocking of input.
   */
  cancel() {
    if (this.blockTimeout) clearTimeout(this.blockTimeout);

    delete this.blockTimeout;
  }

  private handleChange = async (level: boolean) => {
    // do nothing if there is block time in progress
    if (this.isBlocked()) return;
    // don't rise any events if value hasn't changed
    if (level === this.lastIoLevel) return;
    // save last level to compare next time
    this.lastIoLevel = level;
    // don't use blocking logic if blockTime is 0 or less
    if (this.props.blockTime) {
      // start block time
      // unblock after timeout
      this.blockTimeout = setTimeout(() => delete this.blockTimeout, this.props.blockTime);
    }
    // emit event and invert the value if need
    this.changeEvents.emit(invertIfNeed(level, this.isInverted()));
  }

}


export default class Factory extends DriverFactoryBase<BinaryInput, BinaryInputProps> {
  protected SubDriverClass = BinaryInput;
  protected instanceId = (props: BinaryInputProps): string => {
    return `${props.ioSet}${props.pin}`;
  }
}
