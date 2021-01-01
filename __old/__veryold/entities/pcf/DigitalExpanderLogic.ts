// TODO: remove

import {Edge, InputResistorMode, OutputResistorMode, PinDirection} from '../../../system/interfaces/gpioTypes';
import {getBitFromByte, updateBitInByte} from '../squidlet-lib/src/binaryHelpers';
import DigitalExpanderDriver, {DigitalExpanderPinsProps} from './interfaces/DigitalExpanderDriver';
import {ChangeHandler} from '../../interfaces/io/DigitalInputIo';


export default class DigitalExpanderLogic {
  private readonly driver: DigitalExpanderDriver;


  constructor(driver: DigitalExpanderDriver) {
    this.driver = driver;
  }

  init = async () => {
  }

  destroy = async () => {
  }


  // TODO: нужно ли узнавать засетапился пин или нет???


  /**
   * If you did setup after IC initialized then do `initIc()`.
   */
  async setupInput(
    pin: number,
    inputMode: InputResistorMode,
    debounce: number,
    edge: Edge
  ): Promise<void> {
    this.setupBuffer[pin] = {
      direction: PinDirection.input,
      resistor: inputMode,
      debounce,
      edge,
    };

    // TODO: сделать задержку для сборки всех запросов setup, можно с нарастанием
    // TODO: очередь наверное надо сделать

    await this.driver.setup(this.setupBuffer);

    this.setupBuffer = {};
  }

  async setupOutput(pin: number, outputMode: OutputResistorMode, outputInitialValue?: boolean): Promise<void> {
    this.setupBuffer[pin] = {
      direction: PinDirection.output,
      resistor: outputMode,
      initialValue: outputInitialValue,
    };

    // TODO: сделать задержку для сборки всех запросов setup, можно с нарастанием
    // TODO: очередь наверное надо сделать

    await this.driver.setup(this.setupBuffer);

    this.setupBuffer = {};

    // TODO: может initial сделать отдельным запросом????
  }

  getPinProps(pin: number): DigitalExpanderPinsProps | undefined {
    return this.driver.getPinProps(pin);
  }


  // getState = (): number[] => {
  //   return this.currentState;
  // }

  // getPinState(pin: number): boolean | undefined {
  //   this.checkPinRange(pin);
  //
  //   // TODO: resolve byte first
  //
  //   return getBitFromByte(this.currentState, pin);
  // }

  // /**
  //  * Asks IC and returns the current value of a pin.
  //  * If IC hasn't been initialized then it will return false.
  //  * If pin is output then current state of this pin will be returned
  //  */
  // async read(pin: number): Promise<boolean> {
  //   this.checkPinRange(pin);
  //
  //   if (this.i2c.hasFeedback() && this.directions[pin] == PinDirection.input) {
  //     await this.pollOnce();
  //   }
  //
  //   return this.getPinState(pin);
  // }

  /**
   * Set the value of an output pin.
   * @param  {number}  pin The pin number. (0 to 7)
   * @param  {boolean} value The new value for this pin.
   * @return {Promise}
   */
  write(pin: number, value: boolean): Promise<void> {

    return this.driver.write(pin, value);
  }

  async clearPin(pin: number) {
    // TODO: очистить setup и state

    await this.driver.clearPin(pin);
  }

  clearAll() {
    for (let pin = 0; pin < PINS_COUNT; pin ++) {
      delete this.directions[pin];
      delete this.pinDebounces[pin];
    }
  }

}

// /**
//  * Manually initialize IC.
//  * Call this method after all the pins have been initialized and initial values are set up.
//  * And you can repeat it if you setup pin after initialization.
//  */
// initIc() {
// }

// private setWholeState = (state: number) => {
//   this.currentState = state;
// }

// // Direction of each pin. By default all the pin directions are undefined
// private directions: (PinDirection | undefined)[] = [];
// // collection of numbers of ms to use in debounce logic for each pin.
// private pinDebounces: {[index: string]: number} = {};

// getPinDirection(pin: number): PinDirection | undefined {
//   //const pinProps =
//
//   this.checkPinRange(pin);
//
//   return this.directions[pin];
// }
//
// getPinResistorMode(pin: number): OutputResistorMode | InputResistorMode | undefined {
//   // TODO: add
//   // TODO: проверить направление ещё
// }

// wasIcInitialized(): boolean {
//   return this.initIcLogic.wasInitialized;
// }

// /**
//  * Returns array like [true, true, false, false, true, true, false, false].
//  * It is full state includes values of input and output pins. Input pins are always true.
//  * If you did't setup poll or interrupt then call `pollOnce()` before
//  * to be sure that you will receive the last actual data.
//  */
// getState(): boolean[] {
//   return byteToBinArr(this.currentState);
// }

// /**
//  * Are there any input pins.
//  */
// hasInputPins(): boolean {
//   return this.directions.includes(PinDirection.input);
// }

// /**
//  * Set new state of output pins and write them to IC.
//  * Not output pins (input, undefined) are ignored.
//  * e.g to turn pin 0 and pin3 to high level pass 0b00001001
//  */
// async writeState(newState: number): Promise<void> {
//   let preparedState: number = this.currentState;
//
//   for (let pin = 0; pin < PINS_COUNT; pin++) {
//     // don't care about input pins has to be high because they will be set to high in writeToIc() method.
//     if (this.directions[pin] !== PinDirection.output) continue;
//     // update outputs only
//     preparedState = updateBitInByte(preparedState, pin, getBitFromByte(newState, pin));
//   }
//
//   if (this.initIcLogic.isSetupStep) {
//     // set current state and go out if there is setup step
//     this.currentState = preparedState;
//
//     return Promise.resolve();
//   }
//
//   await this.expanderOutput.writeState(preparedState);
// }
