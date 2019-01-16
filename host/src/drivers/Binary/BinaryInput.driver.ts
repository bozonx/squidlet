import IndexedEvents from '../../helpers/IndexedEvents';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {Edge, WatchHandler} from '../../app/interfaces/dev/Digital';
import DriverBase from '../../app/entities/DriverBase';
import {DigitalPinInputDriver, DigitalPinInputDriverProps} from '../DigitalPin/DigitalPinInput.driver';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {invertIfNeed} from '../../helpers/helpers';
import {omit} from '../../helpers/lodashLike';
import {isDigitalInputInverted} from './binaryHelpers';


export interface BinaryInputDriverProps extends DigitalPinInputDriverProps {
  edge: Edge;
  debounce?: number;
  // in this time driver doesn't receive any data
  blockTime?: number;
  // auto invert if pullup resistor is set. Default is true
  invertOnPullup: boolean;
  // when receives 1 actually returned 0 and otherwise
  invert: boolean;
}


export class BinaryInputDriver extends DriverBase<BinaryInputDriverProps> {
  private readonly changeEvents = new IndexedEvents<WatchHandler>();
  private blockTimeInProgress: boolean = false;
  private _isInverted: boolean = false;

  private get digitalInput(): DigitalPinInputDriver {
    return this.depsInstances.digitalInput as any;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this._isInverted = isDigitalInputInverted(this.props.invert, this.props.invertOnPullup, this.props.pullup);

    this.depsInstances.digitalInput = await getDriverDep('DigitalPinInput.driver')
      .getInstance(omit(
        this.props,
        'edge',
        'debounce',
        'blockTime',
        'invertOnPullup',
        'invert'
      ));
  }

  protected didInit = async () => {
    await this.digitalInput.addListener(this.handleInputChange, this.props.debounce, this.resolveEdge());
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

  removeListener(handlerIndex: number) {
    this.changeEvents.removeListener(handlerIndex);
  }

  destroy = () => {
    //this.digitalInput.removeListener(this.listenHandler);
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


  /**
   * It is set invert param - then invert edge
   */
  private resolveEdge(edge?: Edge): Edge {

    // TODO: test

    if (!edge) {
      return 'both';
    }
    else if (this.isInverted() && edge === 'rising') {
      return 'falling';
    }
    else if (this.isInverted() && edge === 'falling') {
      return 'rising';
    }

    return edge;
  }


  protected validateProps = (): string | undefined => {
    // TODO: ???!!!!
    return;
  }

}


export default class Factory extends DriverFactoryBase<BinaryInputDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = BinaryInputDriver;
}
