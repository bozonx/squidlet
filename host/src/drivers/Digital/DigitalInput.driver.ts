const _find = require('lodash/find');
const _omit = require('lodash/omit');

import Digital, {Edge, PinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import HandlerWrappers from '../../helpers/HandlerWrappers';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {I2cConnectionDriver} from '../../network/connections/I2c.connection.driver';
import DriverBase from '../../app/entities/DriverBase';
import {GpioDigitalDriverHandler, PullResistor} from './interfaces/GpioDigitalDriver';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DigitalBaseProps from './interfaces/DigitalBaseProps';
import {invertIfNeed, resolveDriverName} from './digitalHelpers';


interface DigitalInputDriverProps extends DigitalBaseProps {
  // if no one of pullup and pulldown are set then both resistors will off
  // use pullup resistor
  pullup?: boolean;
  // use pulldown resistor
  pulldown?: boolean;
  // debounce time in ms only for input pins. If not set system defaults will be used.
  debounce?: number;
  // Listen to low, high or both levels. By default is both.
  edge?: Edge;
}


// TODO: remake to use digital Dev interface


export class DigitalInputDriver extends DriverBase<DigitalInputDriverProps> {
  private listeners: {[index: string]: [WatchHandler, WatchHandler]} = {};

  //private handlerWrappers = new HandlerWrappers<GpioDigitalDriverHandler, GpioDigitalDriverHandler>();

  private get digital(): Digital {
    return this.depsInstances.digital as Digital;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    const driverName = resolveDriverName(this.props.driver && this.props.driver.name);
    this.depsInstances.digital = getDriverDep(driverName).getInstance(_omit(this.props.driver, 'name'));

    // // setup this pin
    // const pinParams: GpioDigitalDriverPinParams = {
    //   direction: 'input',
    //   pullup: this.props.pullup,
    //   pulldown: this.props.pulldown,
    //
    //
    //   debounce: this.props.debounce,
    //   // default edge is both
    //   edge: this.props.edge || 'both',
    // };

    //const pullResistor: PullResistor = this.resolvePullResistor();
    const debounce: number = this.props.debounce || this.env.system.host.config.config.drivers.defaultDigitalInputDebounce;

    await this.digital.setup(this.props.pin, this.resolvePinMode());
  }


  /**
   * Get current level of pin.
   */
  async getLevel(): Promise<boolean> {
    return invertIfNeed(await this.digital.read(this.props.pin), this.props.invert);
  }

  /**
   * Listen to interruption of pin.
   */
  addListener(handler: GpioDigitalDriverHandler): void {
    const wrapper: GpioDigitalDriverHandler = (level: boolean) => {
      handler(invertIfNeed(level, this.props.invert));
    };

    const listenerId: number = this.digital.setWatch(this.props.pin, handler);

    this.listeners[listenerId] = [wrapper, handler];
  }

  listenOnce(handler: GpioDigitalDriverHandler): void {
    const wrapper: GpioDigitalDriverHandler = (level: boolean) => {
      // remove listener and don't listen any more
      this.removeListener(handler);

      handler(invertIfNeed(level, this.props.invert));
    };

    const listenerId: number = this.digital.setWatch(this.props.pin, handler);

    this.listeners[listenerId] = [wrapper, handler];
  }

  removeListener(handler: GpioDigitalDriverHandler): void {
    _find(this.listeners, (handlerItem: [WatchHandler, WatchHandler], listenerId: number) => {
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

  // resolvePullResistor(): PullResistor {
  //   if (this.props.pullup) return 'pullup';
  //   else if (this.props.pulldown) return 'pulldown';
  //   else return 'none';
  // }

  validateProps = (): string | undefined => {
    // TODO: validate params
    // TODO: validate specific for certain driver params
    return;
  }

}


export default class Factory extends DriverFactoryBase<I2cConnectionDriver, DigitalInputDriverProps> {
  protected instanceIdName: string = 'pin';
  protected DriverClass = I2cConnectionDriver;
}
