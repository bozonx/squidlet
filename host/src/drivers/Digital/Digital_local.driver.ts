import {PullResistor} from './interfaces/GpioDigitalDriver';

const _find = require('lodash/find');

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase, {DriverBaseProps} from '../../app/entities/DriverBase';
import Digital, {Edge, WatchHandler} from '../../app/interfaces/dev/Digital';
import {GetDriverDep} from '../../app/entities/EntityBase';


export interface DigitalLocalDriverProps extends DriverBaseProps {
}


export class DigitalLocalDriver extends DriverBase<DigitalLocalDriverProps> {
  private inputPins: {[index: string]: true} = {};
  private outputPins: {[index: string]: true} = {};
  private debaunceValues: {[index: string]: number} = {};
  private edgeValues: {[index: string]: Edge} = {};
  private listeners: {[index: string]: WatchHandler} = {};


  private get digitalDev(): Digital {
    return this.depsInstances.digitalDev as Digital;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digital = getDriverDep('Digital.dev');
  }


  async setupInput(pin: number, pullResistor: PullResistor, debounce: number, edge?: Edge) {
    // TODO: setup !!!!
  }

  async setupOutput(pin: number, initial?: boolean) {
    // TODO: setup !!!!
  }


  getLevel(pin: number): Promise<boolean> {
    return this.digitalDev.read(pin);
  }

  /**
   * Set level to output pin
   */
  setLevel(pin: number, level: boolean): Promise<void> {
    if (!this.outputPins[pin]) {
      throw new Error(`Can't set level. The local digital gpio GPIO "${pin}" wasn't set up as an output pin.`);
    }

    return this.digitalDev.write(pin, level);
  }

  /**
   * Listen to interruption of input pin
   */
  addListener(pin: number, handler: WatchHandler): void {
    if (!this.inputPins[pin]) {
      throw new Error(`Can't add listener. The local digital GPIO pin "${pin}" wasn't set up as an input pin.`);
    }

    // TODO: get debounce and edge

    const listenerId: number = this.digitalDev.setWatch(pin, handler, this.props.debounce, this.props.edge);

    this.listeners[listenerId] = handler;
  }

  removeListener(handler: WatchHandler): void {
    _find(this.listeners, (handlerItem: WatchHandler, listenerId: number) => {
      if (handlerItem === handler) {
        this.digitalDev.clearWatch(listenerId);

        return true;
      }

      return;
    });
  }

}


export default class GpioInputFactory extends DriverFactoryBase<DigitalLocalDriver, DigitalLocalDriverProps> {
  // TODO: поидее всегда будет один инстанс
  protected instanceIdName: string = 'local';
  protected DriverClass = DigitalLocalDriver;
}
