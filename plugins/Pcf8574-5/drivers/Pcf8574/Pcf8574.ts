/*
 * See example https://www.npmjs.com/package/pcf8574.
 * Handling a PCF8574/PCF8574A IC.
 */

import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import {
  DigitalExpanderOutputDriver,
  DigitalExpanderInputDriver,
  DigitalExpanderDriverHandler,
} from 'system/logic/digitalExpander/interfaces/DigitalExpanderDriver';

import {I2cMaster, I2cMasterDriverProps} from '../../../../entities/drivers/I2cMaster/I2cMaster';
import CommonPcfLogic from '../../logic/CommonPcfLogic';
import {InputResistorMode, OutputResistorMode} from '../../../../system/interfaces/gpioTypes';


export const PINS_COUNT = 8;


export class Pcf8574
  extends DriverBase<I2cMasterDriverProps>
  implements DigitalExpanderOutputDriver, DigitalExpanderInputDriver
{
  private pcf!: CommonPcfLogic;


  init = async () => {
    const i2c = await this.context.getSubDriver<I2cMaster>(
      'I2cMaster',
      this.props
    );

    this.pcf = new CommonPcfLogic(this.context, i2c, PINS_COUNT);
  }

  destroy = async () => {
    this.pcf.destroy();
  }


  setupOutput(
    pin: number,
    resistor?: OutputResistorMode,
    initialValue?: boolean
  ): Promise<void> {
    return this.pcf.setupOutput(pin, resistor, initialValue);
  }

  writeState(state: {[index: string]: boolean}): Promise<void> {
    return this.pcf.writeState(state);
  }

  setupInput(
    pin: number,
    resistor: InputResistorMode,
    debounce: number,
  ): Promise<void> {
    return this.pcf.setupInput(pin, resistor, debounce);
  }

  doPoll = async (): Promise<void> => {
    return this.pcf.doPoll();
  }

  onChange(cb: DigitalExpanderDriverHandler): number {
    return this.pcf.onChange(cb);
  }

  removeListener(handlerIndex: number) {
    this.pcf.removeListener(handlerIndex);
  }

  clearPin(pin: number): Promise<void> {
    return this.pcf.clearPin(pin);
  }

}


export default class Factory extends DriverFactoryBase<Pcf8574, I2cMasterDriverProps> {
  protected SubDriverClass = Pcf8574;
  protected instanceId = (props: I2cMasterDriverProps): string => {
    return `${props.busNum}-${props.address}`;
  }
}
