/*
 * See example https://www.npmjs.com/package/pcf8574.
 * Handling a PCF8574/PCF8574A IC.
 */

import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import {
  DigitalExpanderOutputDriver,
  DigitalExpanderInputDriver,
  DigitalExpanderDriverHandler, DigitalExpanderPinSetup,
} from 'system/logic/digitalExpander/interfaces/DigitalExpanderDriver';
import DigitalExpanderDriverLogic from 'system/logic/digitalExpander/DigitalExpanderDriverLogic';

import {I2cMaster, I2cMasterDriverProps} from '../../../../entities/drivers/I2cMaster/I2cMaster';
import {InputResistorMode, OutputResistorMode} from '../../../../system/interfaces/gpioTypes';
import {howManyOctets} from '../../../../system/lib/binaryHelpers';


export const PINS_COUNT = 8;
// length of data to send and receive to IC
export const DATA_LENGTH = howManyOctets(PINS_COUNT);


export class Pcf8574
  extends DriverBase<I2cMasterDriverProps>
  implements DigitalExpanderOutputDriver, DigitalExpanderInputDriver
{
  private i2cMasterDriver!: I2cMaster;
  private expander!: DigitalExpanderDriverLogic;


  init = async () => {
    this.i2cMasterDriver = await this.context.getSubDriver<I2cMaster>(
      'I2cMaster',
      this.props
    );

    this.expander = new DigitalExpanderDriverLogic(
      this.context,
      {
        //pinsCount: PINS_COUNT,
        setup: this.doSetup,
        writeOutput: this.writeOutput,
        readInput: this.readInput,
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


  private doSetup = (pins: {[index: string]: DigitalExpanderPinSetup}): Promise<void> => {

    // TODO: составить пакет и записать

  }

  private writeOutput = (outputPinsData: {[index: string]: boolean}): Promise<void> => {
    // TODO: составить пакет где output указанны как HIGH а не используемые пины LOW

    return this.i2cMasterDriver.write(data);
  }

  private readInput = (): Promise<{[index: string]: boolean}> => {

    // TODO: отфильтровать только input pins

    return this.i2cMasterDriver.read(dataLength);
  }


  // private checkPinRange(pin: number) {
  //   if (pin < 0 || pin >= PINS_COUNT) {
  //     throw new Error(`Pin "${pin}" out of range`);
  //   }
  // }

}


export default class Factory extends DriverFactoryBase<Pcf8574, I2cMasterDriverProps> {
  protected SubDriverClass = Pcf8574;
  protected instanceId = (props: I2cMasterDriverProps): string => {
    return `${props.busNum}-${props.address}`;
  }
}
