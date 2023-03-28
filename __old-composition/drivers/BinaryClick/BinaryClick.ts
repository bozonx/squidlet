type Timeout = NodeJS.Timeout;
import DriverFactoryBase from 'src/base/DriverFactoryBase';
import DigitalInputIo, {ChangeHandler} from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/DigitalInputIo';
import DriverBase from 'src/base/DriverBase';
import DigitalPinInputProps from '__old/system/interfaces/DigitalPinInputProps';
import {invertIfNeed, isDigitalPinInverted, resolveInputResistorMode} from '../squidlet-lib/src/digitalHelpers';
import IndexedEventEmitter from '../squidlet-lib/src/IndexedEventEmitter';
import {Edge, InputResistorMode} from '__old/system/interfaces/gpioTypes';


type Handler = () => void;

export interface BinaryClickProps extends DigitalPinInputProps {
  // Maximum time of pressed button
  releaseTimeoutMs?: number;
  // the last step of cycle. At this time it doesn't receive any events
  blockTime?: number;
  // auto invert if pullup resistor is set. Default is true
  invert?: boolean;
  // edge actually isn't supported
  invertOnPullup: boolean;
  // when receives 1 actually returned 0 and otherwise
}

enum BinaryClickEvents {
  up,
  down,
  change,
}


/**
 * Click logic. It has steps:
 * * 0 - nothing is happening
 * * 1 - keyDown state, down event emits
 * * 0 - key is up, up event emits
 * * 0 - blocking. Skip any inputs during this time.
 */
export class BinaryClick extends DriverBase<BinaryClickProps> {
  private readonly events = new IndexedEventEmitter();
  // should invert value which is received from IO
  private _isInverted: boolean = false;
  private keyDown: boolean = false;
  private releaseTimeout?: Timeout;
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
    this.log.debug(`BinaryClick: Setup pin ${this.props.pin} of ${this.props.ioSet}`);

    // setup pin as an input with resistor if specified
    // wait for pin has initialized but don't break initialization on error
    try {
      await this.digitalInputIo.setup(
        this.props.pin,
        this.getResistorMode(),
        this.props.debounce,
        Edge.both
      );
    }
    catch (err) {
      this.log.error(
        `BinaryClick: Can't setup pin ${this.props.pin} of ${this.props.ioSet}. ` +
        `"${JSON.stringify(this.props)}": ${err.toString()}`
      );
    }

    await this.digitalInputIo.onChange(this.props.pin, this.handleChange);
  }

  getResistorMode(): InputResistorMode {
    return resolveInputResistorMode(this.props.pullup, this.props.pulldown);
  }

  isDown(): boolean {
    return this.keyDown;
  }

  isBlocked(): boolean {
    return Boolean(this.blockTimeout);
  }

  isInProgress(): boolean {
    return this.isDown() || this.isBlocked();
  }

  /**
   * If changes from IO comes inverted
   */
  isInverted(): boolean {
    return this._isInverted;
  }

  onChange(handler: ChangeHandler): number {
    return this.events.addListener(BinaryClickEvents.change, handler);
  }

  onDown(handler: Handler): number {
    return this.events.addListener(BinaryClickEvents.down, handler);
  }

  onDownOnce(handler: Handler): number {
    return this.events.once(BinaryClickEvents.down, handler);
  }

  onUp(handler: Handler): number {
    return this.events.addListener(BinaryClickEvents.up, handler);
  }

  removeListener(handlerIndex: number): void {
    this.events.removeListener(handlerIndex);
  }

  cancel() {
    this.keyDown = false;

    if (this.releaseTimeout) clearTimeout(this.releaseTimeout);
    if (this.blockTimeout) clearTimeout(this.blockTimeout);

    delete this.releaseTimeout;
    delete this.blockTimeout;
  }


  private handleChange = async (level: boolean) => {
    if (this.isBlocked()) return;

    const resolvedLevel: boolean = invertIfNeed(level, this.isInverted());

    if (resolvedLevel) {
      // if level is high and current state is keyDown and isn't blocked
      // then do nothing - state hasn't been changed
      if (this.keyDown) return;
      // else start a new cycle
      await this.startDownState();
    }
    else {
      // if level is low and current state isn't blocked and isn't keyDown (cycle not started)
      // then do nothing - nothing happened
      if (!this.keyDown) return;
      // else if state is keyDown then finish cycle and start blocking
      // logical 0 = finish
      await this.finishDownState();
    }
  }

  private async startDownState() {
    // set keyDown state
    this.keyDown = true;

    if (this.props.releaseTimeoutMs) {
      // release if timeout is reached
      this.releaseTimeout = setTimeout(() => {
        // At this point finishDownState isn't called.
        // Just clear keyDown state and allow receive new level event.
        this.keyDown = false;

        delete this.releaseTimeout;
      }, this.props.releaseTimeoutMs);
    }

    this.events.emit(BinaryClickEvents.change, this.keyDown);
    this.events.emit(BinaryClickEvents.down);
  }

  private async finishDownState() {
    this.keyDown = false;

    if (this.releaseTimeout) clearTimeout(this.releaseTimeout);

    delete this.releaseTimeout;

    this.events.emit(BinaryClickEvents.change, this.keyDown);
    this.events.emit(BinaryClickEvents.up);

    // don't use blocking logic if blockTime is 0 or less
    if (!this.props.blockTime) return;

    this.blockTimeout = setTimeout(() => {
      delete this.blockTimeout;
    }, this.props.blockTime);
  }

}


export default class Factory extends DriverFactoryBase<BinaryClick, BinaryClickProps> {
  protected SubDriverClass = BinaryClick;
  protected instanceId = (props: BinaryClickProps): string => {
    return `${props.ioSet}${props.pin}`;
  }
}
