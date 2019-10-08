import IndexedEvents from 'system/lib/IndexedEvents';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import {WatchHandler} from 'system/interfaces/io/DigitalIo';
import DriverBase from 'system/base/DriverBase';
import {invertIfNeed, isDigitalInputInverted, resolveEdge} from 'system/lib/helpers';
import {omitObj} from 'system/lib/objects';
import {combineDriverName, generateSubDriverId} from 'system/lib/base/digital/digitalHelpers';

// TODO: review
import {DigitalPinInput, DigitalPinInputProps} from '../../../system/lib/base/digital/DigitalPinInput';


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
  private _isInverted: boolean = false;

  private get digitalInput(): DigitalPinInput {
    return this.depsInstances.digitalInput;
  }


  init = async () => {
    this._isInverted = isDigitalInputInverted(this.props.invert, this.props.invertOnPullup, this.props.pullup);

    this.depsInstances.digitalInput = this.context.getSubDriver(
      'DigitalPinInput',
      {
        ...omitObj(
          this.props,
          'blockTime',
          'invertOnPullup',
          'invert'
        ),
        edge: resolveEdge(this.props.edge, this._isInverted),
      }
    );

    await this.digitalInput.addListener(this.handleInputChange);
  }


  isBlocked(): boolean {
    return this.blockTimeInProgress;
  }

  isInverted(): boolean {
    return this._isInverted;
  }

  async read(): Promise<boolean> {
    return invertIfNeed(await this.digitalInput.read(), this.isInverted());
  }

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
