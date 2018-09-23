const _find = require('lodash/find');
const _omit = require('lodash/omit');

import Digital, {Edge, PinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DigitalBaseProps from './interfaces/DigitalBaseProps';
import {invertIfNeed, resolveDriverName} from './digitalHelpers';


export type ListenHandler = (level: boolean) => void;

export interface DigitalInputDriverProps extends DigitalBaseProps {
  // if no one of pullup and pulldown are set then both resistors will off
  // use pullup resistor
  pullup?: boolean;
  // use pulldown resistor
  pulldown?: boolean;
}


export class DigitalInputDriver extends DriverBase<DigitalInputDriverProps> {
  private listeners: {[index: string]: [ListenHandler, WatchHandler]} = {};

  private get digital(): Digital {
    return this.depsInstances.digital as Digital;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    const driverName = resolveDriverName(this.props.driver && this.props.driver.name);
    this.depsInstances.digital = getDriverDep(driverName).getInstance(_omit(this.props.driver, 'name'));

    await this.digital.setup(this.props.pin, this.resolvePinMode());
  }


  /**
   * Get current binary value of pin.
   */
  async read(): Promise<boolean> {
    return invertIfNeed(await this.digital.read(this.props.pin), this.props.invert);
  }

  /**
   * Listen to interruption of pin.
   * @param handler
   * @param debounce - debounce time in ms only for input pins. If not set system defaults will be used.
   * @param edge - Listen to low, high or both levels. By default is both.
   */
  addListener(handler: ListenHandler, debounce?: number, edge?: Edge): void {
    const wrapper: WatchHandler = (level: boolean) => {
      handler(invertIfNeed(level, this.props.invert));
    };

    const listenerId: number = this.digital.setWatch(
      this.props.pin,
      handler,
      debounce || this.env.system.host.config.config.drivers.defaultDigitalInputDebounce,
      edge
    );

    this.listeners[listenerId] = [wrapper, handler];
  }

  listenOnce(handler: ListenHandler, edge?: Edge): void {
    const wrapper: WatchHandler = (level: boolean) => {
      // remove listener and don't listen any more
      this.removeListener(handler);

      handler(invertIfNeed(level, this.props.invert));
    };

    const listenerId: number = this.digital.setWatch(
      this.props.pin,
      handler,
      this.env.system.host.config.config.drivers.defaultDigitalInputDebounce,
      edge
    );

    this.listeners[listenerId] = [wrapper, handler];
  }

  removeListener(handler: ListenHandler): void {
    _find(this.listeners, (handlerItem: [ListenHandler, WatchHandler], listenerId: number) => {
      if (handlerItem[0] === handler) {
        delete this.listeners[listenerId];
        this.digital.clearWatch(listenerId);

        return true;
      }

      return;
    });
  }

  resolvePinMode(): PinMode {
    if (this.props.pullup) return 'input_pullup';
    else if (this.props.pulldown) return 'input_pulldown';
    else return 'input';
  }

  protected validateProps = (): string | undefined => {
    // TODO: validate params
    // TODO: validate specific for certain driver params
    return;
  }

}


export default class Factory extends DriverFactoryBase<DigitalInputDriver, DigitalInputDriverProps> {
  protected instanceIdName: string = 'pin';
  protected DriverClass = DigitalInputDriver;
}
