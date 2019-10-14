import IndexedEvents from 'system/lib/IndexedEvents';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {DigitalInputMode, Edge, ChangeHandler} from 'system/interfaces/io/DigitalIo';
import {invertIfNeed, isDigitalPinInverted, resolveEdge} from 'system/lib/helpers';
import {resolveInputPinMode} from 'system/lib/base/digital/digitalHelpers';
import DigitalPinInputProps from 'system/lib/base/digital/interfaces/DigitalPinInputProps';
import DriverBase from 'system/base/DriverBase';
import {GpioDigital} from 'system/interfaces/Gpio';


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
  private lastLevel?: boolean;
  // has value to be inverted when change event is rising
  private _isInverted: boolean = false;
  private blockTimeout: any;

  private get gpio(): GpioDigital {
    return this.depsInstances.gpioDevice.gpio;
  }


  init = async () => {
    // TODO: isDigitalPinInverted перенести в digital helpers
    this._isInverted = isDigitalPinInverted(
      this.props.invert,
      this.props.invertOnPullup,
      this.props.pullup
    );

    this.depsInstances.gpioDevice = this.context.system.devicesManager.getDevice(this.props.gpio);
  }

  // setup pin after all the drivers has been initialized
  devicesDidInit = async () => {
    const edge: Edge = resolveEdge(this.props.edge, this._isInverted);

    // TODO: print unique id of sub driver
    this.log.debug(`BinaryInput: Setup pin ${this.props.pin} of ${this.props.gpio}`);

    // setup pin as an input with resistor if specified
    // wait for pin has initialized but don't break initialization on error
    try {
      await this.gpio.digitalSetupInput(this.props.pin, this.getPinMode(), this.props.debounce, edge);
    }
    catch (err) {
      this.log.error(
        `BinaryInput ${this.props.pin} of ${this.props.gpio}: Can't setup pin. ` +
        `"${JSON.stringify(this.props)}": ${err.toString()}`
      );
    }

    // TODO: поидее надо разрешить слушать пин даже если он ещё не проинициализировался ???
    await this.gpio.digitalOnChange(this.props.pin, this.handleChange);
  }


  getPinMode(): DigitalInputMode {
    return resolveInputPinMode(this.props.pullup, this.props.pulldown);
  }

  isBlocked(): boolean {
    return Boolean(this.blockTimeout);
  }

  isInverted(): boolean {
    return this._isInverted;
  }

  async read(): Promise<boolean> {
    return invertIfNeed(await this.gpio.read(this.props.pin), this.isInverted());

    // TODO: может поднять событие если значение изменилось
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

  removeListener(handlerIndex: number): void {
    this.changeEvents.removeListener(handlerIndex);
  }

  /**
   * Cancel blocking of input.
   */
  cancel() {
    clearTimeout(this.blockTimeout);

    delete this.blockTimeout;
  }

  private handleChange = async (level: boolean) => {
    // do nothing if there is block time in progress
    if (this.isBlocked()) return;

    // don't rise any events if value hasn't changed
    if (level === this.lastLevel) return;
    // save last level to compare next time
    this.lastLevel = level;

    // TODO: наверное события запустить после таймаута чтобы на момент правильно пределилися isBlocked
    // emit event and invert the value if need
    this.changeEvents.emit(invertIfNeed(level, this.isInverted()));

    // don't use blocking logic if blockTime is 0 or less
    if (!this.props.blockTime) return;

    // start block time
    // unblock after timeout
    this.blockTimeout = setTimeout(() => delete this.blockTimeout, this.props.blockTime);
  }

}


export default class Factory extends DriverFactoryBase<BinaryInput, BinaryInputProps> {
  protected SubDriverClass = BinaryInput;
  protected instanceId = (props: BinaryInputProps): string => {
    return `${props.gpio}${props.pin}`;
  }
}
