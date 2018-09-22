import {Edge} from '../../app/interfaces/dev/Digital';

const _omit = require('lodash/omit');

import HandlerWrappers from '../../helpers/HandlerWrappers';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {I2cConnectionDriver} from '../../network/connections/I2c.connection.driver';
import DriverBase from '../../app/entities/DriverBase';
import GpioDigitalDriver, {GpioDigitalDriverHandler, GpioDigitalDriverPinParams} from './interfaces/GpioDigitalDriver';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DigitalBaseProps from './interfaces/DigitalBaseProps';
import {resolveDriverName} from './digitalHelpers';


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


export class DigitalInputDriver extends DriverBase<DigitalInputDriverProps> {
  private handlerWrappers = new HandlerWrappers<GpioDigitalDriverHandler, GpioDigitalDriverHandler>();

  private get digital(): GpioDigitalDriver {
    return this.depsInstances.digital as GpioDigitalDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    const driverName = resolveDriverName(this.props.driver && this.props.driver.name);
    this.depsInstances.digital = getDriverDep(driverName).getInstance(_omit(this.props.driver, 'name'));

    // setup this pin
    const pinParams: GpioDigitalDriverPinParams = {
      direction: 'input',
      pullup: this.props.pullup,
      pulldown: this.props.pulldown,

      // TODO: получить дефолтное значение - 20ms
      debounce: this.props.debounce,
      // default edge is both
      edge: this.props.edge || 'both',
    };

    await this.digital.setup(this.props.pin, pinParams);
  }


  /**
   * Get current level of pin.
   */
  async getLevel(): Promise<boolean> {
    const realLevel: boolean = await this.digital.getLevel(this.props.pin);

    if (this.props.invert) return !realLevel;

    return realLevel;
  }

  /**
   * Listen to interruption of pin.
   */
  addListener(handler: GpioDigitalDriverHandler): void {
    const wrapper: GpioDigitalDriverHandler = (level: boolean) => {
      const realLevel: boolean = (this.props.invert) ? !level : level;

      handler(realLevel);
    };

    this.handlerWrappers.addHandler(handler, wrapper);
  }

  listenOnce(handler: GpioDigitalDriverHandler): void {
    const wrapper: GpioDigitalDriverHandler = (level: boolean) => {
      const realLevel: boolean = (this.props.invert) ? !level : level;

      // remove listener and don't listen any more
      this.removeListener(handler);

      handler(realLevel);
    };

    this.handlerWrappers.addHandler(handler, wrapper);
  }

  removeListener(handler: GpioDigitalDriverHandler): void {
    this.handlerWrappers.removeByHandler(handler);
  }

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
