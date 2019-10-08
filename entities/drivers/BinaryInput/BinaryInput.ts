import IndexedEvents from 'system/lib/IndexedEvents';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {DigitalInputMode, DigitalSubDriver, WatchHandler} from 'system/interfaces/io/DigitalIo';
import {invertIfNeed, isDigitalInputInverted, resolveEdge} from 'system/lib/helpers';
import {omitObj} from 'system/lib/objects';
import {combineDriverName, generateSubDriverId, resolvePinMode} from 'system/lib/base/digital/digitalHelpers';
import DigitalPinInputProps from 'system/lib/base/digital/interfaces/DigitalPinInputProps';
import DriverBase from 'system/base/DriverBase';


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
  private _isInverted: boolean = false;

  // TODO: review interface DigitalSubDriver
  private get source(): DigitalSubDriver {
    return this.depsInstances.source;
  }


  // TODO: лучше отдавать режим резистора, так как режим пина и так понятен
  async getPinMode(): Promise<DigitalInputMode> {
    return resolvePinMode(this.props.pullup, this.props.pulldown);
  }


  init = async () => {
    //if (!this.props.source) throw new Error(`BinaryInput: No source: ${this.id}`);

    // TODO: review
    this._isInverted = isDigitalInputInverted(this.props.invert, this.props.invertOnPullup, this.props.pullup);

    this.depsInstances.digitalInput = this.context.getSubDriver(
      combineDriverName(this.props.source),
      {
        ...omitObj(
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
        ),
        edge: resolveEdge(this.props.edge, this._isInverted),
      }
    );

    // setup pin as an input with resistor if specified
    await this.source.setupInput(this.props.pin, this.resolvePinMode(), this.props.debounce, this.props.edge)
      .catch((err) => {
        this.log.error(
          `DigitalPinInputDriver: Can't setup pin. ` +
          `"${JSON.stringify(this.props)}": ${err.toString()}`
        );
      });

    await this.source.setWatch(this.props.pin, this.handleChange);

    // TODO: remake
    await this.digitalInput.addListener(this.handleInputChange);
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

  // TODO: review
  /**
   * Listen to rising and falling of impulse (1 and 0 levels)
   */
  addListener(handler: WatchHandler): number {
    const wrapper: WatchHandler = (level: boolean) => {
      handler(invertIfNeed(level, this.isInverted()));
    };

    return this.changeEvents.addListener(wrapper);
  }

  listenOnce(handler: WatchHandler): number {
    const wrapper: WatchHandler = (level: boolean) => {
      handler(invertIfNeed(level, this.isInverted()));
    };

    return this.changeEvents.once(wrapper);
  }

  removeListener(handlerIndex: number): void {
    this.changeEvents.removeListener(handlerIndex);
  }


  private handleInputChange = async (level: boolean) => {
    // do nothing if there is block time
    if (this.blockTimeInProgress) return;

    this.changeEvents.emit(level);

    if (!this.props.blockTime) return;

    // start block time
    this.blockTimeInProgress = true;

    setTimeout(() => {
      this.blockTimeInProgress = false;
    }, this.props.blockTime);
  }


  protected validateProps = (): string | undefined => {
    // TODO: ???!!!!
    return;
  }

}


export default class Factory extends DriverFactoryBase<BinaryInput, BinaryInputProps> {
  protected SubDriverClass = BinaryInput;
  protected instanceId = (props: BinaryInputProps): string => {
    if (!props.source) throw new Error(`no source. ${this.id}`);

    // TODO: add type
    const driver: any = this.context.getDriver(combineDriverName(props.source));

    return generateSubDriverId(props.source, props.pin, driver.generateUniqId());
  }
}
