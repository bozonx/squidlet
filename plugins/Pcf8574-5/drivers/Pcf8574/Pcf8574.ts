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
import DigitalExpanderSlaveDriverLogic from 'system/logic/digitalExpander/DigitalExpanderSlaveDriverLogic';

import {I2cMaster, I2cMasterDriverProps} from '../../../../entities/drivers/I2cMaster/I2cMaster';
import {InputResistorMode, OutputResistorMode} from '../../../../system/interfaces/gpioTypes';


export const PINS_COUNT = 8;


export class Pcf8574
  extends DriverBase<I2cMasterDriverProps>
  implements DigitalExpanderOutputDriver, DigitalExpanderInputDriver
{
  private i2cMasterDriver!: I2cMaster;
  private expander!: DigitalExpanderSlaveDriverLogic;


  init = async () => {
    this.i2cMasterDriver = await this.context.getSubDriver<I2cMaster>(
      'I2cMaster',
      this.props
    );

    this.expander = new DigitalExpanderSlaveDriverLogic(
      this.context,
      {
        pinsCount: PINS_COUNT,
        write: this.doWrite,
        read: this.doRead,
      }
    );
  }

  destroy = async () => {
    this.expander.destroy();
  }


  setupOutput(
    pin: number,
    resistor?: OutputResistorMode,
    initialValue?: boolean
  ): Promise<void> {
    return this.expander.setupOutput(pin, resistor, initialValue);
  }

  writeState(state: {[index: string]: boolean}): Promise<void> {
    return this.expander.writeState(state);
  }

  setupInput(
    pin: number,
    resistor: InputResistorMode,
    debounce: number,
  ): Promise<void> {
    return this.expander.setupInput(pin, resistor, debounce);
  }

  doPoll = async (): Promise<void> => {
    return this.expander.doPoll();
  }

  onChange(cb: DigitalExpanderDriverHandler): number {
    return this.expander.onChange(cb);
  }

  removeListener(handlerIndex: number) {
    this.expander.removeListener(handlerIndex);
  }

  clearPin(pin: number): Promise<void> {
    return this.expander.clearPin(pin);
  }


  private doWrite = (data: Uint8Array): Promise<void> => {
    return this.i2cMasterDriver.write(data);
  }

  private doRead = (dataLength: number): Promise<Uint8Array> => {
    return this.i2cMasterDriver.read(dataLength);
  }

}


export default class Factory extends DriverFactoryBase<Pcf8574, I2cMasterDriverProps> {
  protected SubDriverClass = Pcf8574;
  protected instanceId = (props: I2cMasterDriverProps): string => {
    return `${props.busNum}-${props.address}`;
  }
}
