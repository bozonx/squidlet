import Digital from '../../app/interfaces/dev/Digital';

const _omit = require('lodash/omit');

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {I2cConnectionDriver} from '../../network/connections/I2c.connection.driver';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DigitalBaseProps from './interfaces/DigitalBaseProps';
import {invertIfNeed, resolveDriverName} from './digitalHelpers';


interface DigitalOutputDriverProps extends DigitalBaseProps {
  initial?: 'low' | 'high';
}


export class DigitalOutputDriver extends DriverBase<DigitalOutputDriverProps> {
  private get digital(): Digital {
    return this.depsInstances.digital as Digital;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    const driverName = resolveDriverName(this.props.driver && this.props.driver.name);
    this.depsInstances.digital = getDriverDep(driverName).getInstance(_omit(this.props.driver, 'name'));

    // // setup this pin
    // const pinParams: GpioDigitalDriverPinParams = {
    //   direction: 'output',
    //   initial: this.calcInitial(),
    // };

    await this.digital.setup(this.props.pin, 'output');

    // set initial level
    this.digital.write(this.props.pin, this.calcInitial());
  }


  /**
   * Get current level of pin.
   */
  async getLevel(): Promise<boolean> {
    return invertIfNeed(await this.digital.read(this.props.pin), this.props.invert);
  }

  async setLevel(newLevel: boolean): Promise<void> {
    const realLevel: boolean = invertIfNeed(newLevel, this.props.invert);

    await this.digital.write(this.props.pin, realLevel);
  }


  private calcInitial(): boolean {
    if (this.props.invert) {
      // if initial === 'high' it'll be logical 0 if undefines of low - 1
      return typeof this.props.initial === 'undefined' || this.props.initial === 'low';
    }
    else {
      // if initial === high it's logical 1, otherwise 0;
      return this.props.initial === 'high';
    }
  }

  validateProps = (): string | undefined => {
    // TODO: validate params
    // TODO: validate props.driver
    // TODO: validate specific for certain driver params
    return;
  }

}


export default class Factory extends DriverFactoryBase<I2cConnectionDriver, DigitalOutputDriverProps> {
  protected instanceIdName: string = 'pin';
  protected DriverClass = I2cConnectionDriver;
}
