import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {I2cConnectionDriver} from '../../network/connections/I2c.connection.driver';
import DriverBase from '../../app/entities/DriverBase';
import GpioDigitalDriver, {GpioDigitalDriverHandler} from './interfaces/GpioDigitalDriver';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DigitalBaseProps from './interfaces/DigitalBaseProps';


interface DigitalInputDriverProps extends DigitalBaseProps {
  // if no one of pullup and pulldown are set then both resistors will off
  // use pullup resistor
  pullup?: boolean;
  // use pulldown resistor
  pulldown?: boolean;
}

// TODO: pin setup
// TODO: add watchOnce
// TODO: инициализировать output значение - 1 или 0

export class DigitalInputDriver extends DriverBase<DigitalInputDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();

  private get digital(): GpioDigitalDriver {
    return this.depsInstances.digital as GpioDigitalDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    // TODO: get driver name
    this.depsInstances.digital = getDriverDep('I2cSlave.dev')
      .getInstance(this.props);
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
    // TODO: add
    // TODO: трансформировать левел
  }

  removeListener(handler: GpioDigitalDriverHandler): void {
    // TODO: add
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
