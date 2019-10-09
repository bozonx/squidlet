import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DigitalIo, {ChangeHandler, DigitalInputMode} from 'system/interfaces/io/DigitalIo';
import DriverBase from 'system/base/DriverBase';
import {omitObj} from 'system/lib/objects';
import DigitalPinInputProps from 'system/lib/base/digital/interfaces/DigitalPinInputProps';
import SourceDriverFactoryBase from 'system/lib/base/digital/SourceDriverFactoryBase';
import {
  generateSubDriverId,
  makeDigitalSourceDriverName,
  resolveInputPinMode,
} from 'system/lib/base/digital/digitalHelpers';
import {isDigitalInputInverted} from 'system/lib/helpers';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {JsonTypes} from 'system/interfaces/Types';


type Handler = () => void;

export interface BinaryClickProps extends DigitalPinInputProps {
  // Maximum time of pressed button
  releaseTimeoutMs?: number;
  // the last step of cycle. At this time it doesn't receive any events
  blockTime?: number;
  // auto invert if pullup resistor is set. Default is true
  invert: boolean;
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
 * * 0 - nothing happening
 * * 1 - keyDown state, down event emits
 * * 0 - key is up, up event emits
 * * 0 - blocking. Skip any inputs during this time.
 */
export class BinaryClick extends DriverBase<BinaryClickProps> {
  private readonly events = new IndexedEventEmitter();
  // should invert value which is received from IO
  private _isInverted: boolean = false;
  private keyDown: boolean = false;
  private releaseTimeout: any;
  private blockTimeout: any;

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
      'releaseTimeoutMs',
      'blockTime',
      'invert',
      'invertOnPullup',
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
    this.log.debug(`BinaryClick: Setup pin ${this.props.pin} of ${this.props.source}`);

    // TODO: перезапускать setup время от времени если не удалось инициализировать пин
    // setup pin as an input with resistor if specified
    // wait for pin has initialized but don't break initialization on error
    try {
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

  isDown(): boolean {
    return this.keyDown;
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

  addChangeListener(handler: ChangeHandler): number {
    return this.events.addListener(BinaryClickEvents.change, handler);
  }

  addDownListener(handler: Handler): number {
    return this.events.addListener(BinaryClickEvents.down, handler);
  }

  addUpListener(handler: Handler): number {
    return this.events.addListener(BinaryClickEvents.up, handler);
  }

  removeListener(handlerIndex: number): void {
    this.events.removeListener(handlerIndex);
  }


  private handleChange = async (level: boolean) => {
    if (this.isBlocked()) return;

    if (level) {
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

    this.events.emit(BinaryClickEvents.change, this.keyDown);
    this.events.emit(BinaryClickEvents.down);

    if (this.props.releaseTimeoutMs) {
      // release if timeout is reached
      this.releaseTimeout = setTimeout(() => {
        // At this point finishDownState isn't called.
        // Just clear keyDown state and allow receive new level event.
        this.keyDown = false;

        delete this.releaseTimeout;
      }, this.props.releaseTimeoutMs);
    }
  }

  private async finishDownState() {
    this.keyDown = false;

    clearTimeout(this.releaseTimeout);

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
    const driver: SourceDriverFactoryBase = this.context.getDriver(makeDigitalSourceDriverName(props.source)) as any;

    return generateSubDriverId(props.source, props.pin, driver.generateUniqId(props));
  }
}
