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

enum BinaryClickEvents {
  up,
  down,
  change,
}

// TODO: add props to manifest
// TODO: no edge
// TODO: add debounce
// TODO: review
export interface BinaryClickProps extends DigitalPinInputProps {
  releaseTimeoutMs: number;
  blockTime?: number;
  // TODO: review
  // auto invert if pullup resistor is set. Default is true
  invertOnPullup: boolean;
  // when receives 1 actually returned 0 and otherwise
  invert: boolean;
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
  //private debounceInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;
  private releaseTimeout: any;
  //private secondDebounceTimeout: any;
  private blockTimeTimeout: any;

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
      // TODO: review props to omit
      'releaseTimeoutMs',
      'blockTime',
      'invertOnPullup',
      'invert',
      'edge',
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
    // TODO: use block timeout
    return this.blockTimeInProgress;
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
      await this.startCycle();
    }
    else {
      // if level is low and current state isn't blocked and isn't keyDown (cycle not started)
      // then do nothing - nothing happened
      if (!this.keyDown) return;
      // else if state is keyDown then finish cycle and start blocking
      // logical 0 = finish
      await this.finishLogic();
    }
  }

  // TODO: review
  private async startCycle() {
    clearTimeout(this.releaseTimeout);
    this.keyDown = true;
    this.events.emit(BinaryClickEvents.change, true);
    this.events.emit(BinaryClickEvents.down);

    // release if timeout is reached
    this.releaseTimeout = setTimeout(() => {
      this.releaseTimeout = undefined;
      //clearTimeout(this.secondDebounceTimeout);
      clearTimeout(this.blockTimeTimeout);
      //this.debounceInProgress = false;
      this.blockTimeInProgress = false;
    }, this.props.releaseTimeoutMs);
  }

  private async finishLogic() {
    this.keyDown = false;
    this.blockTimeInProgress = true;

    this.events.emit(BinaryClickEvents.change, false);
    this.events.emit(BinaryClickEvents.up);

    this.blockTimeTimeout = setTimeout(() => {
      this.blockTimeInProgress = false;
      this.blockTimeTimeout = undefined;

      clearTimeout(this.releaseTimeout);
    }, this.props.blockTime || 0);
  }

  // private async startUpLogic() {
  //   if (this.debounceInProgress) return;
  //
  //   this.debounceInProgress = true;
  //
  //   // TODO: does it need second debounce???
  //   // start second debounce timeout
  //   this.secondDebounceTimeout = setTimeout(async () => {
  //     this.secondDebounceTimeout = undefined;
  //
  //     const currentLevel: boolean = await this.binaryInput.read();
  //
  //     this.debounceInProgress = false;
  //
  //     // if logical 1 = do nothing
  //
  //     if (!currentLevel) {
  //       // logical 0 = finish
  //       await this.finishLogic();
  //     }
  //   }, this.props.debounce);
  // }

}


export default class Factory extends DriverFactoryBase<BinaryClick, BinaryClickProps> {
  protected SubDriverClass = BinaryClick;
  protected instanceId = (props: BinaryClickProps): string => {
    const driver: SourceDriverFactoryBase = this.context.getDriver(makeDigitalSourceDriverName(props.source)) as any;

    return generateSubDriverId(props.source, props.pin, driver.generateUniqId(props));
  }
}
