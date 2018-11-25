const _omit = require('lodash/omit');
import * as EventEmitter from 'eventemitter3';

import DriverFactoryBase, {InstanceType} from '../../app/entities/DriverFactoryBase';
import {Edge} from '../../app/interfaces/dev/Digital';
import DriverBase from '../../app/entities/DriverBase';
import {DigitalPinInputDriver, DigitalPinInputDriverProps, DigitalPinInputListenHandler} from '../DigitalPin/DigitalPinInput.driver';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {isDigitalInverted} from '../../helpers/helpers';


const eventName = 'change';


export interface BinaryInputDriverProps extends DigitalPinInputDriverProps {
  edge: Edge;
  debounce: number;
  // in this time driver doesn't receive any data
  blockTime: number;
  // auto invert if pullup resistor is set. Default is true
  invertOnPullup: boolean;
  // for input: when receives 1 actually returned 0 and otherwise
  // for output: when sends 1 actually sends 0 and otherwise
  invert?: boolean;
}


export class BinaryInputDriver extends DriverBase<BinaryInputDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();
  private blockTimeInProgress: boolean = false;

  private get digitalInput(): DigitalPinInputDriver {
    return this.depsInstances.digitalInput as DigitalPinInputDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalInput = await getDriverDep('DigitalPinInput.driver')
      .getInstance({
        ..._omit(this.props, 'edge', 'debounce', 'blockTime', 'invertOnPullup'),
        invert: this.isInverted(),
      });
  }

  protected didInit = async () => {
    this.digitalInput.addListener(this.listenHandler, this.props.debounce, this.props.edge);
  }


  isBlocked(): boolean {
    return this.blockTimeInProgress;
  }

  isInverted(): boolean {
    return isDigitalInverted(this.props.invertOnPullup, this.props.pullup, this.props.invert);
  }

  async read(): Promise<boolean> {
    return this.digitalInput.read();
  }

  /**
   * Listen to rising and faling of impulse (1 and 0 levels)
   */
  addListener(handler: DigitalPinInputListenHandler) {
    this.events.addListener(eventName, handler);
  }

  listenOnce(handler: DigitalPinInputListenHandler) {
    this.events.once(eventName, handler);
  }

  removeListener(handler: DigitalPinInputListenHandler) {
    this.events.removeListener(eventName, handler);
  }

  destroy = () => {
    this.digitalInput.removeListener(this.listenHandler);
  }


  protected validateProps = (): string | undefined => {
    // TODO: ???!!!!
    return;
  }


  private listenHandler = async (level: boolean) => {
    // do nothing if there is block time
    if (this.blockTimeInProgress) return;

    this.events.emit(eventName, level);

    if (!this.props.blockTime) return;

    // start block time
    this.blockTimeInProgress = true;

    setTimeout(() => {
      this.blockTimeInProgress = false;
    }, this.props.blockTime);
  }

}


export default class Factory extends DriverFactoryBase<BinaryInputDriver> {
  protected DriverClass = BinaryInputDriver;
  protected instanceType: InstanceType = 'alwaysNew';
}
