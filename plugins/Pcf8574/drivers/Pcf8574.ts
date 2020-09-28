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
import {InputResistorMode, OutputResistorMode, PinDirection} from 'system/interfaces/gpioTypes';
import {updateBitInByte} from 'system/lib/binaryHelpers';
import BinaryState from 'system/lib/BinaryState';
import QueueOverride from 'system/lib/QueueOverride';
import IndexedEvents from 'system/lib/IndexedEvents';
import {isEmptyObject} from 'system/lib/objects';

import {I2cMaster, I2cMasterDriverProps} from '../../../entities/drivers/I2cMaster/I2cMaster';


export const PINS_COUNT = 8;
const WRITE_ID = 0;
// TODO: caclucate using PINS_COUNT
// length of data to send and receive to IC
export const DATA_LENGTH = 1;


export class Pcf8574
  extends DriverBase<I2cMasterDriverProps>
  implements DigitalExpanderOutputDriver, DigitalExpanderInputDriver
{
  private i2c!: I2cMaster;
  private events = new IndexedEvents<DigitalExpanderDriverHandler>();
  private inputPins: {[index: string]: true} = {};
  private writeQueue!: QueueOverride;
  // state of pins which has been written to IC before
  private writtenState: {[index: string]: boolean} = {};
  // which pins are input
  // buffer of pins which has to be set up
  //private setupBuffer: {[index: string]: DigitalExpanderPinsProps} = {};
  private writeBuffer?: {[index: string]: boolean};


  init = async () => {
    this.depsInstances.i2c = await this.context.getSubDriver(
      'I2cMaster',
      this.props
    );

    this.writeQueue = new QueueOverride(this.config.config.queueJobTimeoutSec);
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
   * State is {pinNumber: true | false}. Pin number starts from 0.
   */
  writeState(state: {[index: string]: boolean}): Promise<void> {

    // TODO: расслоение буфера
    // TODO: новую запись не нужно хранить в буфере

    this.writeBuffer = {
      ...this.writeBuffer,
      ...state,
    };

    return this.writeQueue.add(this.doWrite, WRITE_ID);
  }


  ////////// Input's

  setupInput(
    pin: number,
    resistor: InputResistorMode,
    debounce: number,
  ): Promise<void> {
    this.inputPins[pin] = true;

    delete this.writtenState[pin];

    if (this.writeBuffer) delete this.writeBuffer[pin];

    // TODO: !!!!!
  }

  /**
   * Read input pins state
   */
  doPoll = async (): Promise<void> => {
    const result: Uint8Array = await this.i2c.read(DATA_LENGTH);
    const state: BinaryState = new BinaryState(DATA_LENGTH, result);
    const objState = state.getObjectState();
    const inputChanges: {[index: string]: boolean} = {};

    for (let pinStr of Object.keys(objState)) {
      if (!this.inputPins[pinStr]) continue;

      inputChanges[pinStr] = objState[pinStr];
    }

    if (isEmptyObject(inputChanges)) return;

    this.events.emit(inputChanges);
  }

  onChange(cb: DigitalExpanderDriverHandler): number {
    return this.events.addListener(cb);
  }

  removeListener(handlerIndex: number): void {
    this.events.removeListener(handlerIndex);
  }

  ////////// Common

  clearPin(pin: number): Promise<void> {
    // TODO: !!!!!
  }


  private async doWrite() {
    const data: Uint8Array = this.collectWriteData();


    // TODO: сохранить в буфер
    //       после успешной записи сохранить в стейт
    //       запись делать в очереди. При ошибке очистить буфер

    try {
      await this.i2c.write(data);
    }
    catch (e) {
      delete this.writeBuffer;

      throw e;
    }

    delete this.writeBuffer;
  }

  private collectWriteData(): Uint8Array {
    // TODO: !!! get input pins, old state, buffer
  }

  // /**
  //  * Just update state and don't save it to IC
  //  */
  // private updateState = (pin: number, value: boolean) => {
  //   // TODO: remake
  //   this.currentState = updateBitInByte(this.currentState, pin, value);
  // }
  //
  // private checkPinRange(pin: number) {
  //   if (pin < 0 || pin >= PINS_COUNT) {
  //     throw new Error(`Pin "${pin}" out of range`);
  //   }
  // }

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




  ////////////////// FROM driver

  // /**
  //  * Listen to changes of pin after edge and debounce were processed.
  //  */
  // onChange(pin: number, handler: ChangeHandler): number {
  //   this.checkPinRange(pin);
  //
  //   return this.expanderInput.onChange(pin, handler);
  // }
  //
  // removeListener(handlerIndex: number) {
  //   this.expanderInput.removeListener(handlerIndex);
  // }
  //
  // /**
  //  * Poll expander manually.
  //  */
  // pollOnce = (): Promise<void> => {
  //   // it is no need to do poll while initialization time because it will be done after initialization
  //   if (!this.initIcLogic.wasInitialized) return Promise.resolve();
  //
  //   return this.i2c.pollOnce();
  // }
  //
  // private startFeedback() {
  //   // if I2C driver doesn't have feedback then it doesn't need to be setup
  //   if (!this.i2c.hasFeedback()) return;
  //
  //   this.i2c.addListener(this.handleIcStateChange);
  //   // make first request and start handle feedback
  //   this.i2c.startFeedback();
  // }
  //
  // private handleIcStateChange = (data: Uint8Array) => {
  //
  //   console.log('------- handleIcStateChange ---------', data)
  //
  //   if (!data || data.length !== DATA_LENGTH) {
  //     return this.log.error(`PCF8574Driver: Incorrect data length has been received`);
  //   }
  //
  //   const receivedByte: number = data[0];
  //
  //   // update values add rise change event of input pins which are changed
  //   for (let pin = 0; pin < PINS_COUNT; pin++) {
  //     // skip not input pins
  //     if (this.directions[pin] !== PinDirection.input) continue;
  //
  //     const newValue: boolean = getBitFromByte(receivedByte, pin);
  //
  //     this.expanderInput.incomeState(pin, newValue, this.pinDebounces[pin]);
  //   }
  // }

}


export default class Factory extends DriverFactoryBase<Pcf8574, I2cMasterDriverProps> {
  protected SubDriverClass = Pcf8574;
  protected instanceId = (props: I2cMasterDriverProps): string => {
    return `${props.busNum}-${props.address}`;
  }
}
