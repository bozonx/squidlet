const _omit = require('lodash/omit');

import GpioDigitalDriver from './interfaces/GpioDigitalDriver';
import DriverFactoryBase, {InstanceType} from '../../app/entities/DriverFactoryBase';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DigitalBaseProps from './interfaces/DigitalBaseProps';
import {invertIfNeed, resolveDriverName} from './digitalHelpers';
import {PinMode} from '../../app/interfaces/dev/Digital';


export interface DigitalPinOutputDriverProps extends DigitalBaseProps {
  _resolvedInitialLevel: boolean;
}


/**
 * This driver works with specified low level drivers like Digital_local, Digital_pcf8574 etc.
 */
export class DigitalPinOutputDriver extends DriverBase<DigitalPinOutputDriverProps> {
  private get gpio(): GpioDigitalDriver {
    return this.depsInstances.gpio as GpioDigitalDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {

    console.log(4444444444, this.props);

    const driverName = resolveDriverName(this.props.gpio);

    this.depsInstances.gpio = await getDriverDep(driverName)
      .getInstance(_omit(this.props, 'initial', 'pin', 'invert', 'gpio'));

  }

  protected didInit = async () => {
    await this.gpio.setup(this.props.pin, 'output');

    // set initial level
    try {
      await this.digitalWrite(this.calcInitial());
    }
    catch (err) {
      throw new Error(`DigitalPinOutputDriver: Can't set initial value
       of "${JSON.stringify(this.props)}": ${err.toString()}`);
    }
  }


  /**
   * Get current level of pin.
   */
  async read(): Promise<boolean> {
    return invertIfNeed(await this.gpio.read(this.props.pin), this.props.invert);
  }

  async write(newLevel: boolean): Promise<void> {
    if (typeof newLevel !== 'boolean') throw new Error(`Invalid type of level`);

    const realLevel: boolean = invertIfNeed(newLevel, this.props.invert);

    await this.digitalWrite(realLevel);
  }


  protected validateProps = (): string | undefined => {
    // TODO: validate params
    // TODO: validate props.driver
    // TODO: validate specific for certain driver params
    return;
  }

  private calcInitial(): boolean {
    if (this.props.invert) {

      // TODO: зачем undefined ????

      // if initial === 'high' it'll be logical 0 if undefines of low - 1
      return typeof this.props.initial === 'undefined' || this.props.initial === 'low';
    }
    else {
      // if initial === high it's logical 1, otherwise 0;
      return this.props.initial === 'high';
    }
  }

  private digitalWrite(value: boolean) {
    const pinMode: PinMode | undefined = this.gpio.getPinMode(this.props.pin);

    if (!pinMode || !pinMode.match(/output/)) {
      throw new Error(`Can't set level. The GPIO pin "${this.props.pin}" wasn't set up as an output pin.`);
    }

    return this.gpio.write(this.props.pin, value);
  }

}


export default class Factory extends DriverFactoryBase<DigitalPinOutputDriver> {
  protected DriverClass = DigitalPinOutputDriver;

  // TODO: remove
  protected instanceType: InstanceType = 'alwaysNew';

  // TODO: не правильно!!!! может быть наложение если брать экспандеры

  // protected calcInstanceId = (instanceProps: {[index: string]: any}): string => {
  //   const driverName: string = (instanceProps.driver && instanceProps.driver.name)
  //     ? instanceProps.driver.name
  //     : 'local';
  //
  //   return `${driverName}-${instanceProps.pin}`;
  // }
}
