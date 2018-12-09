import _omit = require('lodash/omit');

import IndexedEvents from '../../helpers/IndexedEvents';
import {WatchHandler} from '../../app/interfaces/dev/Digital';
import {isDigitalInputInverted} from '../../helpers/helpers';
import DriverBase from '../../app/entities/DriverBase';
import {DigitalPinInputDriver, DigitalPinInputDriverProps} from '../DigitalPin/DigitalPinInput.driver';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';


export interface ImpulseInputDriverProps extends DigitalPinInputDriverProps {
  // time between 1 and 0
  impulseLength: number;
  // in this time driver doesn't receive any data
  blockTime: number;
  // if specified - it will wait for specified time
  // and after that read level and start impulse if level is 1
  throttle?: number;
  // auto invert if pullup resistor is set. Default is true
  invertOnPullup: boolean;
  // for input: when receives 1 actually returned 0 and otherwise
  // for output: when sends 1 actually sends 0 and otherwise
  invert: boolean;
}


export class ImpulseInputDriver extends DriverBase<ImpulseInputDriverProps> {
  private readonly risingEvents: IndexedEvents = new IndexedEvents();
  private readonly bothEvents: IndexedEvents = new IndexedEvents();
  private throttleInProgress: boolean = false;
  private impulseInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;

  private get digitalInput(): DigitalPinInputDriver {
    return this.depsInstances.digitalInput as DigitalPinInputDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalInput = await getDriverDep('DigitalPinInput.driver')
      .getInstance({
        ..._omit(this.props, 'impulseLength', 'blockTime', 'throttle', 'invertOnPullup'),
        invert: this.isInverted(),
      });
  }

  protected didInit = async () => {
    //const debounce: number = Math.ceil(this.props.impulseLength / 2);
    const debounce: number = this.props.impulseLength;

    this.digitalInput.addListener(this.listenHandler, debounce, 'rising');
  }


  isInverted(): boolean {
    return isDigitalInputInverted(this.props.invert, this.props.invertOnPullup, this.props.pullup);
  }

  async read(): Promise<boolean> {
    return this.digitalInput.read();
  }

  /**
   * Listen only to rising of impulse, not falling.
   */
  addRisingListener(handler: WatchHandler): number {
    return this.risingEvents.addListener(handler);
  }

  /**
   * Listen to rising and faling of impulse (1 and 0 levels)
   */
  addListener(handler: WatchHandler): number {
    return this.bothEvents.addListener(handler);
  }

  listenOnce(handler: WatchHandler): number {
    return this.risingEvents.once(handler);
  }

  removeRisingListener(handlerIndex: number) {
    this.risingEvents.removeListener(handlerIndex);
  }

  removeListener(handlerIndex: number) {
    this.bothEvents.removeListener(handlerIndex);
  }

  destroy = () => {
    this.digitalInput.removeListener(this.listenHandler);
  }


  protected validateProps = (): string | undefined => {
    // TODO: impulseLength не может быть 0 или меньше
    // TODO: throttle не может быть 0 или меньше
    return;
  }


  private listenHandler = async () => {
    // don't process new impulse while current is in progress
    if (this.throttleInProgress || this.impulseInProgress || this.blockTimeInProgress) return;

    if (typeof this.props.throttle === 'undefined') {
      await this.startImpulse();
    }
    else {
      await this.throttle();
    }
  }

  private async throttle(): Promise<void> {
    this.throttleInProgress = true;

    // waiting and then read level
    return new Promise<void>((resolve, reject) => {
      setTimeout(async () => {
        const currentValue: boolean = await this.digitalInput.read();

        this.throttleInProgress = false;

        // if level is 0 - it isn't an impulse - do nothing
        if (!currentValue) return;

        this.startImpulse()
          .then(resolve)
          .catch(reject);
      }, Number(this.props.throttle));
    });
  }

  private async startImpulse(): Promise<void> {
    this.impulseInProgress = true;

    this.risingEvents.emit();
    this.bothEvents.emit(true);

    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.bothEvents.emit(false);
        this.impulseInProgress = false;

        if (this.props.blockTime) {
          this.startBlockTime()
            .then(resolve)
            .catch(reject);
        }
        else {
          resolve();
        }
      }, this.props.impulseLength);
    });
  }

  private async startBlockTime(): Promise<void> {
    this.blockTimeInProgress = true;

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.blockTimeInProgress = false;

        resolve();
      }, this.props.blockTime);
    });
  }

}


export default class Factory extends DriverFactoryBase<ImpulseInputDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = ImpulseInputDriver;
}
