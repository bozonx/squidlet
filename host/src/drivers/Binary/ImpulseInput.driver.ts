import IndexedEvents from '../../helpers/IndexedEvents';
import {WatchHandler} from '../../app/interfaces/dev/Digital';
import DriverBase from '../../app/entities/DriverBase';
import {DigitalPinInputDriver, DigitalPinInputDriverProps} from '../DigitalPin/DigitalPinInput.driver';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {omit} from '../../helpers/lodashLike';
import {isDigitalInputInverted} from './binaryHelpers';
import {resolveEdge} from '../../helpers/helpers';


type RisingHandler = () => void;

export interface ImpulseInputDriverProps extends DigitalPinInputDriverProps {
  // time between 1 and 0
  impulseLength: number;
  // in this time driver doesn't receive any data
  blockTime: number;
  // TODO: may be use just debounce ???
  // if specified - it will wait for specified time
  //   and after that read level and start impulse if level is 1
  throttle?: number;
  // auto invert if pullup resistor is set. Default is true
  invertOnPullup: boolean;
  // for input: when receives 1 actually returned 0 and otherwise
  // for output: when sends 1 actually sends 0 and otherwise
  invert: boolean;
}


export class ImpulseInputDriver extends DriverBase<ImpulseInputDriverProps> {
  private readonly risingEvents = new IndexedEvents<RisingHandler>();
  private readonly bothEvents = new IndexedEvents<WatchHandler>();
  private throttleInProgress: boolean = false;
  private impulseInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;
  private _isInverted: boolean = false;

  private get digitalInput(): DigitalPinInputDriver {
    return this.depsInstances.digitalInput as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this._isInverted = isDigitalInputInverted(this.props.invert, this.props.invertOnPullup, this.props.pullup);

    this.depsInstances.digitalInput = await getDriverDep('DigitalPinInput.driver')
      .getInstance({
        ...omit(
          this.props,
          'impulseLength',
          'blockTime',
          'throttle',
          'invertOnPullup',
          'invert'
        ),
        edge: resolveEdge('rising', this._isInverted),
        // TODO: ??? why
        //debounce: this.props.impulseLength,
        debounce: 0,
      });
  }

  protected didInit = async () => {
    //const debounce: number = Math.ceil(this.props.impulseLength / 2);
    //const debounce: number = this.props.impulseLength;

    await this.digitalInput.addListener(this.handleInputChange);
  }


  isImpulseInProgress(): boolean {
    return this.throttleInProgress || this.impulseInProgress;
  }

  isBlocked(): boolean {
    return this.blockTimeInProgress;
  }

  isInverted(): boolean {
    return this._isInverted;
  }

  async read(): Promise<boolean> {

    // TODO: вернуть текущее состояние

    return this.digitalInput.read();
  }

  /**
   * Listen only to rising of impulse, not falling.
   */
  addRisingListener(handler: RisingHandler): number {
    return this.risingEvents.addListener(handler);
  }

  /**
   * Listen to rising and faling of impulse (1 and 0 levels)
   */
  addListener(handler: WatchHandler): number {
    return this.bothEvents.addListener(handler);
  }

  listenOnce(handler: RisingHandler): number {
    // TODO: why not bothEvents?
    return this.risingEvents.once(handler);
  }

  removeRisingListener(handlerIndex: number) {
    this.risingEvents.removeListener(handlerIndex);
  }

  removeListener(handlerIndex: number) {
    this.bothEvents.removeListener(handlerIndex);
  }


  private handleInputChange = () => {
    // don't process new impulse while current is in progress
    if (this.throttleInProgress || this.impulseInProgress || this.blockTimeInProgress) return;

    if (typeof this.props.throttle === 'undefined') {
      this.startImpulse();
    }
    else {
      this.throttle();
    }
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

  private throttle(): void {
    this.throttleInProgress = true;

    // waiting and then read level
    setTimeout(async () => {
      const currentValue: boolean = await this.digitalInput.read();

      this.throttleInProgress = false;

      // if level is 0 - it isn't an impulse - do nothing
      if (!currentValue) return;

      this.startImpulse()
        .then(resolve)
        .catch(reject);
    }, Number(this.props.throttle));
  }

  private startBlockTime(): void {
    // if block time isn't set = do nothing
    if (!this.props.blockTime) return;

    this.blockTimeInProgress = true;

    setTimeout(() => {
      this.blockTimeInProgress = false;
    }, this.props.blockTime);
  }


  protected validateProps = (): string | undefined => {
    // TODO: impulseLength не может быть 0 или меньше
    // TODO: throttle не может быть 0 или меньше
    return;
  }


}


export default class Factory extends DriverFactoryBase<ImpulseInputDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = ImpulseInputDriver;
}
