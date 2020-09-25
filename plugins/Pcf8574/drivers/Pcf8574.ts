/*
 * See example https://www.npmjs.com/package/pcf8574.
 * Handling a PCF8574/PCF8574A IC.
 */

import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import {
  DigitalExpanderDriverHandler,
  DigitalExpanderOutputDriver,
  DigitalExpanderInputDriver
} from 'system/logic/digitalExpander/interfaces/DigitalExpanderDriver';
import {Edge, InputResistorMode, OutputResistorMode, PinDirection} from 'system/interfaces/gpioTypes';
import {updateBitInByte} from 'system/lib/binaryHelpers';

import {I2cMaster, I2cMasterDriverProps} from '../../../entities/drivers/I2cMaster/I2cMaster';


// length of data to send and receive to IC
export const DATA_LENGTH = 1;


export class Pcf8574
  extends DriverBase<I2cMasterDriverProps>
  implements DigitalExpanderOutputDriver, DigitalExpanderInputDriver
{
  private i2c!: I2cMaster;
  // buffer of pins which has to be set up
  private setupBuffer: {[index: string]: DigitalExpanderPinsProps} = {};


  init = async () => {
    this.depsInstances.i2c = await this.context.getSubDriver(
      'I2cMaster',
      this.props
    );
  }

  destroy = async () => {
  }


  setupOutput(
    pin: number,
    resistor?: OutputResistorMode,
    initialValue?: boolean
  ): Promise<void> {
    // TODO: !!!!!
  }

  // /**
  //  * Read whole state of IC.
  //  * If IC has 8 pins then one byte will be returned if 16 then 2 bytes.
  //  */
  // async readState(): Promise<Uint8Array> {
  //   return this.i2c.read(DATA_LENGTH);
  // }

  /**
   * Write whole state to IC.
   * If IC has 8 pins then pass 1 byte if 16 then 2 bytes.
   */
  writeState(state: {[index: string]: boolean}): Promise<void> {

    this.checkPinRange(pin);
    if (typeof this.directions[pin] !== 'undefined') {
      throw new Error(
        `PCF8574Driver.setupInput(${pin}, ${debounce}). This pin has been already set up.` +
        `Call "clearPin()" and try to set up again`
      );
    }

    if (typeof debounce !== 'undefined') {
      this.pinDebounces[pin] = debounce;
    }
    this.directions[pin] = PinDirection.input;

    if (state.length !== DATA_LENGTH) {
      throw new Error(`It is able to write 1 byte of state to IC`);
    }


    // TODO: what to do with outputMode ???

    this.checkPinRange(pin);

    if (typeof this.directions[pin] !== 'undefined') {
      throw new Error(
        `PCF8574Driver.setupOutput(${pin}, ${outputInitialValue}). This pin has been already set up` +
        `Call "clearPin()" and try to set up again`
      );
    }

    this.directions[pin] = PinDirection.output;

    if (typeof outputInitialValue !== 'undefined') {
      this.updateState(pin, outputInitialValue);
    }



    await this.i2c.write(state);
  }


  ////////// Input's

  setupInput(
    pin: number,
    resistor: InputResistorMode,
    debounce?: number,
    edge?: Edge
  ): Promise<void> {
    // TODO: !!!!!
  }

  /**
   * Read input pins state
   */
  doPoll = async (): Promise<void> => {
    // TODO: !!!!!
  }

  onChange(cb: DigitalExpanderDriverHandler): number {
    // TODO: !!!!!
  }

  removeListener(handlerIndex: number): void {
    // TODO: !!!!!
  }

  ////////// Common

  clearPin(pin: number): Promise<void> {
    // TODO: !!!!!
  }


  /**
   * Just update state and don't save it to IC
   */
  private updateState = (pin: number, value: boolean) => {
    // TODO: remake
    this.currentState = updateBitInByte(this.currentState, pin, value);
  }

  private checkPinRange(pin: number) {
    if (pin < 0 || pin >= PINS_COUNT) {
      throw new Error(`Pin "${pin}" out of range`);
    }
  }

  // write(pin: number, value: boolean): Promise<void> {
  //   // in case it is writing at the moment - save buffer and add cb to queue
  //   if (this.isWriting()) {
  //     return this.invokeAtWritingTime(pin, value);
  //   }
  //   // start buffering step or update buffer
  //   else if(this.writeBufferMs) {
  //     // in buffering case collect data at the buffering time (before writing)
  //     return this.invokeBuffering(pin, value);
  //   }
  //   // else if buffering doesn't set - just start writing
  //   const stateToWrite = updateBitInByte(this.getState(), pin, value);
  //
  //   return this.startWriting(stateToWrite);
  // }

  /**
   * Write given state to the IC.
   */
  private writeToIc = (newStateByte: number): Promise<void> => {
    if (this.directions[pin] !== PinDirection.output) {
      return Promise.reject(new Error('Pin is not defined as an output'));
    }

    if (this.initIcLogic.isSetupStep) {
      // update current value of pin and go out if there is setup step
      this.updateState(pin, value);

      return Promise.resolve();
    }



    let preparedState: number = newStateByte;

    if (this.hasInputPins()) {
      for (let pin = 0; pin < PINS_COUNT; pin++) {
        if (this.directions[pin] !== PinDirection.input) continue;
        // set height level for inputs. It needs for PCF IC
        preparedState = updateBitInByte(preparedState, pin, true);
      }
    }

    const dataToSend: Uint8Array = new Uint8Array(DATA_LENGTH);
    // fill data
    dataToSend[0] = preparedState;

    return this.i2c.write(dataToSend);
  }

}


export default class Factory extends DriverFactoryBase<Pcf8574, I2cMasterDriverProps> {
  protected SubDriverClass = Pcf8574;
  protected instanceId = (props: I2cMasterDriverProps): string => {
    return `${props.busNum}-${props.address}`;
  }
}
