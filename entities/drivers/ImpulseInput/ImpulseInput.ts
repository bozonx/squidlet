type Timeout = NodeJS.Timeout;
import {ChangeHandler} from 'system/interfaces/io/DigitalIo';
import DriverBase from 'system/base/DriverBase';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {isDigitalPinInverted, resolveEdge} from 'system/lib/digitalHelpers';
import {resolveInputResistorMode} from 'system/lib/digitalHelpers';
import DigitalPinInputProps from 'system/interfaces/DigitalPinInputProps';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {GpioDigital} from 'system/interfaces/Gpio';
import {Edge, InputResistorMode} from 'system/interfaces/gpioTypes';
import DeviceBase from 'system/base/DeviceBase';


type RisingHandler = () => void;
type ImpulseInputMode = 'fixed' | 'increasing';


// TODO: edge isn't supported but it in DigitalPinInputProps
export interface ImpulseInputProps extends DigitalPinInputProps {
  // duration of impulse in ms
  impulseLength: number;
  // in this time driver doesn't receive any data
  blockTime: number;

  mode: ImpulseInputMode;
  // auto invert if pullup resistor is set. Default is true
  invertOnPullup: boolean;
  // invert value which is sent to IO
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
  private blockTimeout?: Timeout;
  private impulseTimeout?: Timeout;
  private _isInverted: boolean = false;

  private get gpio(): GpioDigital {
    return this.depsInstances.gpioDevice.gpio;
  }


  init = async () => {
    this._isInverted = isDigitalPinInverted(
      this.props.invert,
      this.props.invertOnPullup,
      this.props.pullup
    );

    const device: DeviceBase = this.context.system.devicesManager.getDevice(this.props.gpio);

    this.depsInstances.gpioDevice = device;

    device.onInit(() => {
      this.handleGpioInit()
        .catch(this.log.error);
    });
  }

  // setup pin after all the drivers has been initialized
  handleGpioInit = async () => {
    this.log.debug(`ImpulseInput: Setup pin ${this.props.pin} of ${this.props.gpio}`);

    const edge: Edge = resolveEdge('rising', this.isInverted());

    // setup pin as an input with resistor if specified
    // wait for pin has initialized but don't break initialization on error
    try {
      // listen to only high levels
      await this.gpio.digitalSetupInput(this.props.pin, this.getResistorMode(), this.props.debounce, edge);
    }
    catch (err) {
      this.log.error(
        `ImpulseInput: Can't setup pin ${this.props.pin} of ${this.props.gpio}. ` +
        `"${JSON.stringify(this.props)}": ${err.toString()}`
      );
    }

    await this.gpio.digitalOnChange(this.props.pin, this.handleChange);
  }


  getResistorMode(): InputResistorMode {
    return resolveInputResistorMode(this.props.pullup, this.props.pulldown);
  }

  isBlocked(): boolean {
    return Boolean(this.blockTimeout);
  }

  isImpulseInProgress(): boolean {
    return Boolean(this.impulseTimeout);
  }

  /**
   * If changes from IO comes inverted
   */
  isInverted(): boolean {
    return this._isInverted;
  }

  isInProgress(): boolean {
    return this.isImpulseInProgress() || this.isBlocked();
  }

  /**
   * Cancel impulse or block
   */
  cancel() {
    if (this.impulseTimeout) clearTimeout(this.impulseTimeout);
    if (this.blockTimeout) clearTimeout(this.blockTimeout);

    delete this.impulseTimeout;
    delete this.blockTimeout;
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
      if (this.impulseTimeout) clearTimeout(this.impulseTimeout);
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
    return `${props.gpio}${props.pin}`;
  }
}
