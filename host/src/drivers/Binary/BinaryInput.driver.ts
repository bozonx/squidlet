import {invertIfNeed} from '../DigitalPin/digitalHelpers';

const _omit = require('lodash/omit');
import * as EventEmitter from 'eventemitter3';

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {Edge, WatchHandler} from '../../app/interfaces/dev/Digital';
import DriverBase from '../../app/entities/DriverBase';
import {DigitalPinInputDriver, DigitalPinInputDriverProps} from '../DigitalPin/DigitalPinInput.driver';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {isDigitalInputInverted} from '../../helpers/helpers';
import HandlerWrappers from '../../helpers/HandlerWrappers';


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
  invert: boolean;
}


export class BinaryInputDriver extends DriverBase<BinaryInputDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();
  private handlerWrappers: HandlerWrappers<WatchHandler, WatchHandler> = new HandlerWrappers<WatchHandler, WatchHandler>();
  private blockTimeInProgress: boolean = false;
  private _isInverted: boolean = false;

  private get digitalInput(): DigitalPinInputDriver {
    return this.depsInstances.digitalInput as DigitalPinInputDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this._isInverted = isDigitalInputInverted(this.props.invert, this.props.invertOnPullup, this.props.pullup);

    this.depsInstances.digitalInput = await getDriverDep('DigitalPinInput.driver')
      .getInstance(_omit(this.props, 'edge', 'debounce', 'blockTime', 'invertOnPullup', 'invert'));
  }

  protected didInit = async () => {
    this.digitalInput.addListener(this.listenHandler, this.props.debounce, this.resolveEdge());
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
   * Listen to rising and faling of impulse (1 and 0 levels)
   */
  addListener(handler: WatchHandler) {
    const wrapper: WatchHandler = (level: boolean) => {
      handler(invertIfNeed(level, this.isInverted()));
    };

    this.handlerWrappers.addHandler(handler, wrapper);
    this.events.addListener(eventName, wrapper);
  }

  listenOnce(handler: WatchHandler) {
    const wrapper: WatchHandler = (level: boolean) => {
      this.handlerWrappers.removeByHandler(handler);
      handler(invertIfNeed(level, this.isInverted()));
    };

    this.handlerWrappers.addHandler(handler, wrapper);

    this.events.once(eventName, wrapper);
  }

  removeListener(handler: WatchHandler) {
    this.events.removeListener(eventName, handler);
    this.handlerWrappers.removeByHandler(handler);
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


  /**
   * It is set invert param - then invert edge
   * @param edge
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

}


export default class Factory extends DriverFactoryBase<BinaryInputDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = BinaryInputDriver;
}
