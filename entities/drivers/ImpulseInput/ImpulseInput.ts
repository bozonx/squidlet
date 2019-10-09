import IndexedEvents from 'system/lib/IndexedEvents';
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


type RisingHandler = () => void;

// TODO: reivew
// TODO: reivew in manifest
export interface ImpulseInputProps extends DigitalPinInputProps {
  // time between 1 and 0
  impulseLength: number;
  // in this time driver doesn't receive any data
  blockTime: number;
  // if specified - it will wait for specified time
  //   and after that read level and start impulse if level is 1
  //throttle?: number;
  // auto invert if pullup resistor is set. Default is true
  invertOnPullup: boolean;
  // for input: when receives 1 actually returned 0 and otherwise
  // for output: when sends 1 actually sends 0 and otherwise
  invert: boolean;
}


// TODO: add doc
export class ImpulseInput extends DriverBase<ImpulseInputProps> {
  private readonly risingEvents = new IndexedEvents<RisingHandler>();
  private readonly bothEvents = new IndexedEvents<ChangeHandler>();
  //private throttleInProgress: boolean = false;
  private impulseInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;
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
    // TODO: use timeout
    return this.blockTimeInProgress;
  }

  /**
   * If changes from IO comes inverted
   */
  isInverted(): boolean {
    return this._isInverted;
  }


  // TODO: review below


  async read(): Promise<boolean> {
    //return this.digitalInput.read();
    //return this.throttleInProgress || this.impulseInProgress;
    return this.impulseInProgress;
  }

  /**
   * Listen only to rising of impulse, not falling.
   */
  addRisingListener(handler: RisingHandler): number {
    return this.risingEvents.addListener(handler);
  }

  listenRisingOnce(handler: RisingHandler): number {
    return this.risingEvents.once(handler);
  }

  /**
   * Listen to rising and faling of impulse (1 and 0 levels)
   */
  addListener(handler: ChangeHandler): number {
    return this.bothEvents.addListener(handler);
  }

  removeRisingListener(handlerIndex: number) {
    this.risingEvents.removeListener(handlerIndex);
  }

  removeListener(handlerIndex: number) {
    this.bothEvents.removeListener(handlerIndex);
  }


  private handleChange = () => {
    // don't process new impulse while current is in progress
    //if (this.throttleInProgress || this.impulseInProgress || this.blockTimeInProgress) return;
    if (this.impulseInProgress || this.blockTimeInProgress) return;

    this.startImpulse();

    // if (typeof this.props.throttle === 'undefined') {
    //   this.startImpulse();
    // }
    // else {
    //   this.throttle();
    // }
  }

  private startImpulse(): void {
    this.impulseInProgress = true;

    this.risingEvents.emit();
    this.bothEvents.emit(true);

    setTimeout(() => {
      this.impulseInProgress = false;
      this.bothEvents.emit(false);

      // start block time if need
      this.startBlockTime();
    }, this.props.impulseLength);
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

    setTimeout(() => {
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
