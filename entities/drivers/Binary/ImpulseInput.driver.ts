import IndexedEvents from '../../../host/helpers/IndexedEvents';
import {WatchHandler} from '../../../host/interfaces/dev/Digital';
import DriverBase from '../../../host/baseDrivers/DriverBase';
import {DigitalPinInputDriver, DigitalPinInputDriverProps} from '../DigitalPin/DigitalPinInput.driver';
import {GetDriverDep} from '../../../host/entities/EntityBase';
import DriverFactoryBase from '../../../host/baseDrivers/DriverFactoryBase';
import {omit} from '../../../host/helpers/lodashLike';
import {isDigitalInputInverted, resolveEdge} from '../../../host/helpers/helpers';


type RisingHandler = () => void;

export interface ImpulseInputDriverProps extends DigitalPinInputDriverProps {
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


export class ImpulseInputDriver extends DriverBase<ImpulseInputDriverProps> {
  private readonly risingEvents = new IndexedEvents<RisingHandler>();
  private readonly bothEvents = new IndexedEvents<WatchHandler>();
  //private throttleInProgress: boolean = false;
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
          //'throttle',
          'invertOnPullup',
          'invert'
        ),
        edge: resolveEdge('rising', this._isInverted),
      });
  }

  protected didInit = async () => {
    await this.digitalInput.addListener(this.handleInputChange);
  }


  isBlocked(): boolean {
    return this.blockTimeInProgress;
  }

  isInverted(): boolean {
    return this._isInverted;
  }

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
  addListener(handler: WatchHandler): number {
    return this.bothEvents.addListener(handler);
  }

  removeRisingListener(handlerIndex: number) {
    this.risingEvents.removeListener(handlerIndex);
  }

  removeListener(handlerIndex: number) {
    this.bothEvents.removeListener(handlerIndex);
  }


  private handleInputChange = () => {
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
