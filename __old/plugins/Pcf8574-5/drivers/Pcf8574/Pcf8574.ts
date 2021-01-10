/*
 * See example https://www.npmjs.com/package/pcf8574.
 * Handling a PCF8574/PCF8574A IC.
 */

import DriverFactoryBase from 'src/base/DriverFactoryBase';
import DriverBase from 'src/base/DriverBase';
import {
  DigitalExpanderInputDriver,
  DigitalExpanderOutputDriver,
  DigitalExpanderPinSetup,
} from '__old/system/logic/digitalExpander/interfaces/DigitalExpanderDriver';
import {InputResistorMode, OutputResistorMode, PinDirection} from '__old/system/interfaces/gpioTypes';
import {bitsToBytes, bytesToBits, howManyOctets} from '../squidlet-lib/src/binaryHelpers';
import DigitalExpanderSetupLogic from '__old/system/logic/digitalExpander/DigitalExpanderSetupLogic';

import {I2cMaster, I2cMasterDriverProps} from '../../../../../../squidlet-networking/src/drivers/I2cMaster/I2cMaster';


export const PINS_COUNT = 8;
// length of data to send and receive to IC
export const DATA_LENGTH = howManyOctets(PINS_COUNT);


export class Pcf8574
  extends DriverBase<I2cMasterDriverProps>
  implements DigitalExpanderOutputDriver, DigitalExpanderInputDriver
{
  private i2cMasterDriver!: I2cMaster;
  private setupLogic!: DigitalExpanderSetupLogic;
  //private writeQueue: BufferedQueue;


  init = async () => {
    this.i2cMasterDriver = await this.context.getSubDriver<I2cMaster>(
      'I2cMaster',
      this.props
    );

    this.setupLogic = new DigitalExpanderSetupLogic(this.context, {
      doSetup: this.doSetup,
    });
  }

  destroy = async () => {
    this.setupLogic.destroy();
  }


  /**
   * Resistor will be skipped
   */
  setupOutput(
    pin: number,
    resistor?: OutputResistorMode,
    initialValue?: boolean
  ): Promise<void> {
    return this.setupLogic.setupPin(pin, {
      direction: PinDirection.output,
      initialValue,
    });
  }

  /**
   * Write state of several pins.
   * State is {pinNumber: true | false}. Pin number starts from 0.
   * it relies to upper level logic which has a queue and buffer
   */
  writeState(state: {[index: string]: boolean}): Promise<void> {
    return this.writeOutput(state);
  }

  /**
   * Resistor will be skipped
   */
  setupInput(
    pin: number,
    resistor: InputResistorMode,
    debounce: number,
  ): Promise<void> {
    if (debounce) {
      return Promise.reject(`PCF expander board can't handle a debounce`);
    }

    return this.setupLogic.setupPin(pin, {
      direction: PinDirection.input,
      debounce,
    });
  }

  readInputPins(): Promise<{[index: string]: boolean} | undefined> {
    return this.readAllInputs();
  }

  // TODO: это вообще зачем ???
  clearPin(pin: number): Promise<void> {
    return this.setupLogic.clearPin(pin);
  }

  wasPinInitialized(pin: number): boolean {
    return this.setupLogic.wasPinInitialized(pin);
  }

  getAllPinsProps(): {[index: string]: DigitalExpanderPinSetup} {
    return this.setupLogic.getAllPinsProps();
  }

  getPinProps(pin: number): DigitalExpanderPinSetup | undefined {
    return this.setupLogic.getPinProps(pin);
  }


  private doSetup = (pins: {[index: string]: DigitalExpanderPinSetup}): Promise<void> => {
    const result: boolean[] = [];

    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // if pin is going to set up
      if (pins[pin]) {
        if (pins[pin].direction === PinDirection.input) {
          result[pin] = true;
        }
        else {
          result[pin] = pins[pin].initialValue || false;
        }
      }
      // pin has been set up before or hasn't been set. Try to resolve it's state
      else {
        result[pin] = this.resolvePinBitState(pin);
      }
    }

    return this.i2cMasterDriver.write(bitsToBytes(result));
  }

  // TODO: review
  private writeOutput = (outputPinsData: {[index: string]: boolean}): Promise<void> => {
    const result: boolean[] = new Array(PINS_COUNT);

    for (let pin = 0; pin < PINS_COUNT; pin++) {
      result[pin] = this.resolvePinBitState(pin, outputPinsData[pin]);
    }

    return this.i2cMasterDriver.write(bitsToBytes(result));
  }

  // TODO: move to readInputPins
  // TODO: review
  private readAllInputs = async (): Promise<{[index: string]: boolean}> => {
    const icData: Uint8Array = await this.i2cMasterDriver.read(DATA_LENGTH);

    if (icData.length !== DATA_LENGTH) {
      throw new Error(`Incorrect data length has been received`);
    }

    const bitsData: boolean[] = bytesToBits(icData);
    // filtered only input pins values
    const inputChanges: {[index: string]: boolean} = {};

    for (let pinStr in bitsData) {
      if (this.expander.getPinDirection(parseInt(pinStr)) !== PinDirection.input) continue;

      inputChanges[pinStr] = bitsData[pinStr];
    }

    return inputChanges;
  }

  // TODO: review
  private resolvePinBitState(pin: number, outputState?: boolean): boolean {
    // TODO: что делать с пинами которые ещё в процессе инициализации
    const direction: PinDirection | undefined = this.expander.getPinDirection(pin);
    // if pin is input switch it to HIGH state
    if (direction === PinDirection.input) {
      return true;
    }
    else if (direction === PinDirection.output) {
      if (typeof outputState === 'undefined') {
        // pin hasn't been changed - return previously changed state
        return this.expander.getWrittenState()[pin] || false;
      }
      else {
        // return new state
        return outputState;
      }
    }
    // use LOW state for pins which hasn't been set up.
    return false;
  }


  // private checkPinRange(pin: number) {
  //   if (pin < 0 || pin >= PINS_COUNT) {
  //     throw new Error(`Pin "${pin}" out of range`);
  //   }
  // }

  // doPoll = async (): Promise<void> => {
  //   return this.expander.doPoll();
  // }
  //
  // onChange(cb: DigitalExpanderDriverHandler): number {
  //   return this.expander.onChange(cb);
  // }
  //
  // removeListener(handlerIndex: number) {
  //   this.expander.removeListener(handlerIndex);
  // }

}


export default class Factory extends DriverFactoryBase<Pcf8574, I2cMasterDriverProps> {
  protected SubDriverClass = Pcf8574;
  protected instanceId = (props: I2cMasterDriverProps): string => {
    return `${props.busNum}-${props.address}`;
  }
}
