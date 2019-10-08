import IndexedEvents from 'system/lib/IndexedEvents';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {DigitalInputMode, DigitalIo, Edge, WatchHandler} from 'system/interfaces/io/DigitalIo';
import {invertIfNeed, isDigitalInputInverted, resolveEdge} from 'system/lib/helpers';
import {omitObj} from 'system/lib/objects';
import {makeDigitalSourceDriverName, generateSubDriverId, resolveInputPinMode} from 'system/lib/base/digital/digitalHelpers';
import DigitalPinInputProps from 'system/lib/base/digital/interfaces/DigitalPinInputProps';
import DriverBase from 'system/base/DriverBase';
import {JsonTypes} from 'system/interfaces/Types';


export interface BinaryInputProps extends DigitalPinInputProps {
  // in this time driver doesn't receive any data
  blockTime?: number;
  // auto invert if pullup resistor is set. Default is true
  invertOnPullup: boolean;
  // when receives 1 actually returned 0 and otherwise
  invert: boolean;
}


export class BinaryInput extends DriverBase<BinaryInputProps> {
  private readonly changeEvents = new IndexedEvents<WatchHandler>();
  private blockTimeInProgress: boolean = false;
  private lastValue?: boolean;
  // has value to be inverted when change event is rising
  private _isInverted: boolean = false;

  private get source(): DigitalIo {
    return this.depsInstances.source;
  }


  // TODO: лучше отдавать режим резистора, так как режим пина и так понятен
  getPinMode(): DigitalInputMode {
    return resolveInputPinMode(this.props.pullup, this.props.pulldown);
  }

  // TODO: добавить возможность сбросить block time

  init = async () => {
    // TODO: isDigitalInputInverted перенести в digital helpers
    this._isInverted = isDigitalInputInverted(
      this.props.invert,
      this.props.invertOnPullup,
      this.props.pullup
    );

    // make rest of props to pass them to the sub driver
    const subDriverProps: {[index: string]: JsonTypes} = omitObj(
      this.props,
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
    const edge: Edge = resolveEdge(this.props.edge, this._isInverted);

    // TODO: print unique id of sub driver
    this.log.debug(`BinaryInput: Setup pin ${this.props.pin} of ${this.props.source}`);

    // TODO: перезапускать setup время от времени
    // setup pin as an input with resistor if specified
    // wait for pin has initialized but don't break initialization on error
    try {
      await this.source.setupInput(this.props.pin, this.getPinMode(), this.props.debounce, edge);
    }
    catch (err) {
      this.log.error(
        `BinaryInput: Can't setup pin. ` +
        `"${JSON.stringify(this.props)}": ${err.toString()}`
      );
    }

    // TODO: поидее надо разрешить слушать пин даже если он ещё не проинициализировался
    await this.source.addListener(this.props.pin, this.handleChange);
  }


  isBlocked(): boolean {
    return this.blockTimeInProgress;
  }

  isInverted(): boolean {
    return this._isInverted;
  }

  async read(): Promise<boolean> {
    return invertIfNeed(await this.source.read(this.props.pin), this.isInverted());
  }

  // TODO: review - зачем здесь инвертировать можно же  в handleChange ???
  /**
   * Listen to rising and falling of impulse (1 and 0 levels)
   */
  addListener(handler: WatchHandler): number {
    const wrapper: WatchHandler = (level: boolean) => {
      handler(invertIfNeed(level, this.isInverted()));
    };

    return this.changeEvents.addListener(wrapper);
  }

  // TODO: review - зачем здесь инвертировать можно же  в handleChange ???
  listenOnce(handler: WatchHandler): number {
    const wrapper: WatchHandler = (level: boolean) => {
      handler(invertIfNeed(level, this.isInverted()));
    };

    return this.changeEvents.once(wrapper);
  }

  removeListener(handlerIndex: number): void {
    this.changeEvents.removeListener(handlerIndex);
  }


  private handleChange = async (level: boolean) => {
    // do nothing if there is block time
    if (this.blockTimeInProgress) return;

    // TODO: может инвертировать здесь ????
    this.changeEvents.emit(level);

    if (!this.props.blockTime) return;

    // start block time
    this.blockTimeInProgress = true;

    setTimeout(() => {
      this.blockTimeInProgress = false;
    }, this.props.blockTime);
  }

}


export default class Factory extends DriverFactoryBase<BinaryInput, BinaryInputProps> {
  protected SubDriverClass = BinaryInput;
  protected instanceId = (props: BinaryInputProps): string => {
    if (!props.source) throw new Error(`no source. ${this.id}`);

    // TODO: add type
    const driver: any = this.context.getDriver(makeDigitalSourceDriverName(props.source));

    return generateSubDriverId(props.source, props.pin, driver.generateUniqId());
  }
}
