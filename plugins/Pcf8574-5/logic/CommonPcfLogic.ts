import {
  DigitalExpanderDriverHandler,
  DigitalExpanderEvents,
  DigitalExpanderInputDriver,
  DigitalExpanderOutputDriver,
  DigitalExpanderPinInitHandler,
  DigitalExpanderPinSetup
} from 'system/logic/digitalExpander/interfaces/DigitalExpanderDriver';
import {InputResistorMode, OutputResistorMode, PinDirection} from 'system/interfaces/gpioTypes';
import BinaryState from 'system/lib/BinaryState';
import {cloneDeepObject, isEmptyObject} from 'system/lib/objects';
import {bitsToBytes, howManyOctets, updateBitInByte} from 'system/lib/binaryHelpers';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import QueueOverride from 'system/lib/QueueOverride';
import DebounceCallIncreasing from 'system/lib/debounceCall/DebounceCallIncreasing';
import Context from 'system/Context';

import {I2cMaster} from '../../../entities/drivers/I2cMaster/I2cMaster';


enum QUEUE_IDS {
  setup,
  write,
  read,
}
const SETUP_DEBOUNCE_MS = 10;


export default class CommonPcfLogic
  implements DigitalExpanderOutputDriver, DigitalExpanderInputDriver
{
  private readonly context: Context;
  private readonly i2c: I2cMaster;
  private readonly pinsCount: number;
  // length of data to send and receive to IC
  private readonly dataLength: number;
  private events = new IndexedEventEmitter();
  private inputPins: {[index: string]: true} = {};
  private queue: QueueOverride;
  // state of pins which has been written to IC before
  private writtenState: {[index: string]: boolean} = {};
  // which pins are input
  // buffer of pins which has to be set up
  private setupBuffer?: {[index: string]: DigitalExpanderPinSetup};
  private writeBuffer?: {[index: string]: boolean};
  private setupDebounce = new DebounceCallIncreasing();


  constructor(context: Context, i2c: I2cMaster, pinsCount: number) {
    this.context = context;
    this.i2c = i2c;
    this.pinsCount = pinsCount;
    this.dataLength = howManyOctets(pinsCount);
    this.queue = new QueueOverride(this.context.config.config.queueJobTimeoutSec);
  }

  destroy() {
    this.events.destroy();
    this.queue.destroy();
    this.setupDebounce.destroy();
  }


  setupOutput(
    pin: number,
    resistor?: OutputResistorMode,
    initialValue?: boolean
  ): Promise<void> {
    return this.startSetupPin(pin, {
      direction: PinDirection.output,
      initialValue,
    });
  }

  /**
   * Write whole state to IC.
   * State is {pinNumber: true | false}. Pin number starts from 0.
   */
  writeState(state: {[index: string]: boolean}): Promise<void> {

    // TODO: пока идет setup сохранять в буфер, после сделать запись
    // TODO: нельзя запускать пока идет setup этого пина
    // TODO: нельзя записывать input pins

    this.writeBuffer = {
      ...this.writeBuffer || {},
      ...state,
    };

    return this.queue.add(this.writeIc, QUEUE_IDS.write);
  }


  ////////// Input's
  setupInput(
    pin: number,
    resistor: InputResistorMode,
    debounce: number,
  ): Promise<void> {
    if (debounce) {
      return Promise.reject(`PCF expander board can't handle a debounce`);
    }
    // resistor doesn't mater.
    return this.startSetupPin(pin, {
      direction: PinDirection.input,
      debounce,
    });
  }

  /**
   * Read input pins state
   */
  doPoll = async (): Promise<void> => {

    // TODO: нельзя делать пока не сделался setup хоть одного пина
    //       это случай если вообще не была запущенна конфигурация или она в процессе
    //       если закончилась инициализация то просто ставим в очередь

    const result: Uint8Array = await this.readIc();
    // TODO: не обязательно тогда использовать BinaryState
    const state: BinaryState = new BinaryState(this.dataLength, result);
    const objState = state.getObjectState();
    const inputChanges: {[index: string]: boolean} = {};

    for (let pinStr of Object.keys(objState)) {
      if (!this.inputPins[pinStr]) continue;

      inputChanges[pinStr] = objState[pinStr];
    }

    if (isEmptyObject(inputChanges)) return;

    this.events.emit(DigitalExpanderEvents.change, inputChanges);
  }

  onChange(cb: DigitalExpanderDriverHandler): number {
    return this.events.addListener(DigitalExpanderEvents.change, cb);
  }

  removeListener(handlerIndex: number): void {
    this.events.removeListener(handlerIndex);
  }

  ////////// Common

  async clearPin(pin: number): Promise<void> {
    delete this.inputPins[pin];
    delete this.writtenState[pin];

    if (this.setupBuffer) delete this.setupBuffer[pin];
    if (this.writeBuffer) delete this.writeBuffer[pin];
  }

  wasPinInitialized(pin: number): boolean {
    return typeof this.inputPins[pin] !== 'undefined'
      || typeof this.writtenState[pin] !== 'undefined';
  }

  onPinInitialized(cb: DigitalExpanderPinInitHandler): number {
    return this.events.addListener(DigitalExpanderEvents.setup, cb);
  }


  /**
   * It waits forever while pin has been initialized.
   */
  private startSetupPin(pin: number, pinSetup: DigitalExpanderPinSetup): Promise<void> {

    // TODO: очистить пин сначла

    return new Promise<void>(((resolve, reject) => {
      if (!this.setupBuffer) this.setupBuffer = {};

      this.setupBuffer[pin] = pinSetup;

      this.setupDebounce.invoke(() => {
        const handlerIndex = this.onPinInitialized((initializedPins: number[]) => {
          if (!initializedPins.includes(pin)) return;

          this.events.removeListener(handlerIndex);
          resolve();
        });

        this.doSetup()
          .catch(this.context.log.debug);
      }, SETUP_DEBOUNCE_MS)
        .catch(reject);
    }));
  }

  private async doSetup() {
    // it means some pins has been cleaned
    if (!this.setupBuffer || isEmptyObject(this.setupBuffer)) return;

    const data: Uint8Array = this.collectSetupData();
    const setupBuffer: {[index: string]: DigitalExpanderPinSetup} = cloneDeepObject(
      this.setupBuffer
    );

    delete this.setupBuffer;

    try {
      await this.queue.add(() => this.i2c.write(data), QUEUE_IDS.setup);
    }
    catch (e) {
      // put back setupBuffer
      this.setupBuffer = {
        ...setupBuffer,
        ...this.setupBuffer || {},
      };

      // do setup again and don't wait for result
      this.doSetup()
        .catch(this.context.log.debug);

      throw e;
    }

    const initializedPins: number[] = [];

    for (let pinStr of Object.keys(setupBuffer)) {
      const pin: number = parseInt(pinStr);

      initializedPins.push(pin);

      if (setupBuffer[pin].direction === PinDirection.input) {
        this.inputPins[pin] = true;
      }
      else {
        this.writtenState[pin] = setupBuffer[pin].initialValue || false;
      }
    }

    this.events.emit(DigitalExpanderEvents.setup, initializedPins);
  }

  private async writeIc() {
    const data: Uint8Array = this.collectWriteData();

    // TODO: сохранить в буфер
    //       после успешной записи сохранить в стейт
    //       запись делать в очереди. При ошибке очистить буфер

    // TODO: когда очистить writeBuffer

    try {
      await this.i2c.write(data);
    }
    catch (e) {
      delete this.writeBuffer;

      throw e;
    }

    delete this.writeBuffer;
  }

  private readIc(): Promise<Uint8Array> {
    return new Promise<Uint8Array>(((resolve, reject) =>  {
      const handlerIndex = this.events.once(
        DigitalExpanderEvents.incomeRawData,
        resolve
      );
      // this handler can be overwritten by others
      // because of that we use events here
      const readHandler = async () => {
        const data: Uint8Array = await this.i2c.read(this.dataLength);

        //   if (!data || data.length !== DATA_LENGTH) {
        //     return this.log.error(`PCF8574Driver: Incorrect data length has been received`);
        //   }

        this.events.emit(DigitalExpanderEvents.incomeRawData, data);
      };

      this.queue.add(readHandler, QUEUE_IDS.read)
        .catch((e) => {
          this.events.removeListener(handlerIndex);
          reject(e);
        });
    }));
  }

  private collectWriteData(): Uint8Array {
    const result: boolean[] = new Array(this.pinsCount);

    for (let pin = 0; pin < this.pinsCount; pin++) {
      // if pin is input switch it to HIGH state
      if (this.inputPins[pin]) {
        result[pin] = true;
      }
      // if pin is going to be saved
      else if (this.writeBuffer && typeof this.writeBuffer[pin] !== 'undefined') {
        result[pin] = this.writeBuffer[pin];
      }
      // not changed
      else {
        result[pin] = this.writtenState[pin] || false;
      }
    }

    return bitsToBytes(result);
  }

  private collectSetupData(): Uint8Array {
    const result: boolean[] = [];

    for (let pin = 0; pin < this.pinsCount; pin++) {
      if (this.setupBuffer && this.setupBuffer[pin]) {

      }
      // if pin is input switch it to HIGH state
      else if (this.inputPins[pin]) {
        result[pin] = true;
      }
      // if pin is going to be saved
      else if (this.writeBuffer && typeof this.writeBuffer[pin] !== 'undefined') {
        result[pin] = this.writeBuffer[pin];
      }
      // not changed
      else {
        result[pin] = this.writtenState[pin] || false;
      }
    }

    return bitsToBytes(result);
  }


  // private checkPinRange(pin: number) {
  //   if (pin < 0 || pin >= PINS_COUNT) {
  //     throw new Error(`Pin "${pin}" out of range`);
  //   }
  // }

  // private startFeedback() {
  //   // if I2C driver doesn't have feedback then it doesn't need to be setup
  //   if (!this.i2c.hasFeedback()) return;
  //
  //   this.i2c.addListener(this.handleIcStateChange);
  //   // make first request and start handle feedback
  //   this.i2c.startFeedback();
  // }

}
