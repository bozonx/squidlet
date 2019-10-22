/*
 * Remake of https://www.npmjs.com/package/pcf8574 module.
 * Handling a PCF8574/PCF8574A IC.
 */

import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import {byteToBinArr, getBitFromByte, updateBitInByte} from 'system/lib/binaryHelpers';
import DebounceCall from 'system/lib/debounceCall/DebounceCall';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {Edge, PinDirection} from 'system/interfaces/gpioTypes';
import {ChangeHandler} from 'system/interfaces/io/DigitalIo';

import {I2cToSlave, I2cToSlaveDriverProps} from '../I2cToSlave/I2cToSlave';
import {omitObj} from '../../../system/lib/objects';


export interface Pcf8574ExpanderProps extends I2cToSlaveDriverProps {
  writeBufferMs?: number;
}


// Count of pins which IC has
export const PINS_COUNT = 8;
// length of data to send and receive to IC
export const DATA_LENGTH = 1;


export class Pcf8574 extends DriverBase<Pcf8574ExpanderProps> {
  // Direction of each pin. By default all the pin directions are undefined
  private readonly directions: (PinDirection | undefined)[] = [];
  // Bitmask representing the current state of the pins
  private currentState: number = 0;
  // State which is sets on write and removes after it
  private tmpState?: number;
  // time from the beginning to start initializing IC
  private setupStep: boolean = true;
  private initIcStep: boolean = false;
  // collection of numbers of ms to use in debounce logic for each pin.
  private readonly pinDebounces: {[index: string]: number | undefined} = {};
  // collection of edges values of each pin to use in change handler
  private readonly pinEdges: {[index: string]: Edge | undefined} = {};
  private readonly debounceCall: DebounceCall = new DebounceCall();
  private readonly changeEvents = new IndexedEventEmitter<ChangeHandler>();

  private get i2cDriver(): I2cToSlave {
    return this.depsInstances.i2cDriver;
  }


  init = async () => {
    this.depsInstances.i2cDriver = await this.context.getSubDriver(
      'I2cToSlave',
      {
        ...omitObj(this.props, 'writeBufferMs'),
        // TODO: review
        poll: [
          {length: DATA_LENGTH}
        ],
      }
    );
  }

  destroy = async () => {
    // TODO: add
  }

  // protected appDidInit = async () => {
  //   // init IC state after app is initialized if it isn't at this moment
  //   try {
  //     await this.writeToIc(this.currentState);
  //   }
  //   catch (err) {
  //     this.log.error(`PCF8574. Can't init IC state, props are "${JSON.stringify(this.props)}". ${String(err)}`);
  //   }
  // }

  /**
   * Manually initialize IC.
   * Call this method after all the pins have been initialized and initial values are set up.
   * And you can repeat it if you setup pin after initialization.
   */
  async initIc() {
    // mark end of setup step
    this.setupStep = false;
    this.initIcStep = true;

    try {
      await this.writeToIc(this.currentState);
    }
    catch (e) {
      this.initIcStep = false;

      throw e;
    }
    // if I2C driver doesn't have feedback then it doesn't need to be setup
    if (!this.i2cDriver.hasFeedback()) return;

    // TODO: review - почему бы это не сделать в самом i2cDriver ?
    this.i2cDriver.addPollErrorListener((functionStr: number | string | undefined, err: Error) => {
      this.log.error(String(err));
    });

    this.i2cDriver.addListener(this.handleIcStateChange);
    // make first request and start handle feedback
    this.i2cDriver.startFeedback();

    this.initIcStep = false;
  }


  /**
   * If you did setup after IC initialized then do `initIc()`.
   */
  async setupInput(pin: number, debounce?: number, edge?: Edge): Promise<void> {
    this.checkPin(pin);

    if (typeof this.directions[pin] !== 'undefined') {
      throw new Error(
        `PCF8574Driver.setupInput(${pin}, ${debounce}, ${edge}). This pin has been already set up.` +
        `Call "clearPin()" and try to set up again`
      );
    }

    this.pinDebounces[pin] = debounce;
    this.pinEdges[pin] = edge;
    this.directions[pin] = PinDirection.input;

    // set input pin to high
    this.updateCurrentState(pin, true);
  }

  async setupOutput(pin: number, outputInitialValue?: boolean): Promise<void> {
    this.checkPin(pin);

    if (typeof this.directions[pin] !== 'undefined') {
      throw new Error(
        `PCF8574Driver.setupOutput(${pin}, ${outputInitialValue}). This pin has been already set up` +
        `Call "clearPin()" and try to set up again`
      );
    }

    this.directions[pin] = PinDirection.output;

    if (typeof outputInitialValue !== 'undefined') {
      this.updateCurrentState(pin, outputInitialValue);
    }
  }

  getPinDirection(pin: number): PinDirection | undefined {
    return this.directions[pin];
  }

  isIcInitialized(): boolean {
    return !this.setupStep && !this.initIcStep;
  }

  /**
   * Are there any input pins.
   */
  hasInputPins(): boolean {
    return this.directions.includes(PinDirection.input);
  }

  /**
   * Listen to changes of pin after edge and debounce were processed.
   */
  onChange(pin: number, handler: ChangeHandler): number {
    return this.changeEvents.addListener(pin, handler);
  }

  removeListener(handlerIndex: number) {
    this.changeEvents.removeListener(handlerIndex);
  }

  /**
   * Poll expander manually.
   */
  pollOnce(): Promise<void> {
    // TODO: лучше повешать на промис 1го poll или так оставить
    // there is no need to do poll before initialization because after initialization it will be done
    if (!this.isIcInitialized()) return Promise.resolve();

    return this.i2cDriver.pollOnce();
  }

  /**
   * Returns array like [true, true, false, false, true, true, false, false].
   * It is full state includes values of input and output pins. Input pins are always true.
   * If you did't setup poll or interrupt then call `pollOnce()` before
   * to be sure that you will receive the last actual data.
   */
  getState(): boolean[] {
    return byteToBinArr(this.currentState);
  }

  /**
   * Returns the current value of a pin.
   * If you did't setup poll or interrupt then call `pollOnce()` before
   * to be sure that you will receive the last actual data.
   * @param  {number} pin The pin number. (0 to 7)
   * @return {boolean} The current value.
   */
  read(pin: number): boolean {
    this.checkPin(pin);

    // TODO: или всетаки зачитать значения сначала из IC ???

    return getBitFromByte(this.currentState, pin);
  }

  /**
   * Set the value of an output pin.
   * @param  {number}  pin   The pin number. (0 to 7)
   * @param  {boolean} value The new value for this pin.
   * @return {Promise}
   */
  async write(pin: number, value: boolean): Promise<void> {
    this.checkPin(pin);

    if (this.directions[pin] !== PinDirection.output) {
      throw new Error('Pin is not defined as an output');
    }

    if (this.setupStep) {
      // update current value of pin and go out if there is setup step
      this.currentState = updateBitInByte(this.currentState, pin, value);

      return;
    }

    // TODO: если запущенна инициализация - то записываем в стейт и ставим в очередь новую запись

    // TODO: что будет если ещё выполнится 2й запрос в очереди - на тот момент же будет удален tmpState ???
    // TODO: что за логика с tmpState ???

    if (typeof this.tmpState === 'undefined') {
      this.tmpState = this.currentState;
    }

    this.tmpState = updateBitInByte(this.tmpState, pin, value);

    // TODO: нельзя записывать пока не запущенна инициализация
    // TODO: если инициализация в процессе - то после ее завершения сделать новую запись

    try {
      await this.writeToIc(this.tmpState);

      if (this.tmpState) {
        this.currentState = this.tmpState;
        this.tmpState = undefined;
      }
    }
    catch (err) {
      this.tmpState = undefined;

      throw err;
    }
  }

  /**
   * Set new state of output pins and write them to IC.
   * Not output pins (input, undefined) are ignored.
   */
  async writeState(outputValues: boolean[]): Promise<void> {
    // TODO: full review
    //if (!this.checkInitialization('writeState')) return;

    if (typeof this.tmpState === 'undefined') {
      this.tmpState = this.currentState;
    }

    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // skit not an output pin
      if (this.directions[pin] !== PinDirection.output) continue;

      this.tmpState = updateBitInByte(this.tmpState, pin, outputValues[pin]);
    }

    // TODO: нельзя записывать пока не запущенна инициализация
    // TODO: если инициализация в процессе - то после ее завершения сделать новую запись

    try {
      await this.writeToIc(this.tmpState);

      if (this.tmpState) {
        this.currentState = this.tmpState;
        this.tmpState = undefined;
      }
    }
    catch (err) {
      this.tmpState = undefined;

      throw err;
    }
  }

  clearPin(pin: number) {
    // TODO: add
  }

  clearAll() {
    for (let pin = 0; pin < PINS_COUNT; pin ++) {
      this.clearPin(pin);
    }
  }


  private handleIcStateChange = (functionStr: number | string | undefined, data: Uint8Array) => {
    if (!data || data.length !== DATA_LENGTH) {
      return this.log.error(`PCF8574Driver: Incorrect data length has been received`);
    }

    this.setNewInputsState(data[0]);
  }

  private setNewInputsState(receivedByte: number) {
    // update values add rise change event of input pins which are changed
    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // skip not input pins
      if (this.directions[pin] !== PinDirection.input) continue;

      const newValue: boolean = getBitFromByte(receivedByte, pin);
      const oldValue: boolean = getBitFromByte(this.currentState, pin);

      // check if value changed. If not changed = nothing happened.
      if (newValue !== oldValue) {
        // if value was changed then update state and rise an event.
        this.handleInputPinChange(pin, newValue);
      }
    }
  }

  private handleInputPinChange(pin: number, newPinValue: boolean) {
    // TODO: в обоих случаях сначала сделать свой poll который поставится в очередь и ждать его завершения
    // TODO: нужно накапливать запросы poll и если в процессе были новые то делать ещё 1 запрос
    // TODO: но если мы сделаем poll once то опять поднимется событие и будет зацикленность
    //       может тогда просто ждать завершения poll ????
    // TODO: либо не делать poll здесь, а учитывать чтобы debounce был больше poll interval

    // this.pollOnce()
    //   .then(() => {
    //   })
    //   .catch((e) => this.log.error(e));

    if (!this.pinDebounces[pin]) {
      // emit right now if there isn't debounce
      this.handleEndOfDebounce(pin, newPinValue);
    }
    else {
      // wait for debounce and read current level
      this.debounceCall.invoke(() => {
        this.handleEndOfDebounce(pin, newPinValue);
      }, this.pinDebounces[pin], pin)
        .catch((e) => this.log.error(e));
    }
  }

  private handleEndOfDebounce(pin: number, newPinValue: boolean) {
    // skip not suitable edge
    if (this.pinEdges[pin] === Edge.rising && !newPinValue) {
      return;
    }
    else if (this.pinEdges[pin] === Edge.falling && newPinValue) {
      return;
    }

    // set a new value
    this.updateCurrentState(pin, newPinValue);
    // rise a new event even value hasn't been actually changed since first check
    this.changeEvents.emit(pin, newPinValue);
  }

  /**
   * Write given state to the IC.
   */
  private writeToIc(newStateByte: number): Promise<void> {
    const dataToSend: Uint8Array = new Uint8Array(DATA_LENGTH);
    // fill data
    dataToSend[0] = newStateByte;

    return this.i2cDriver.write(undefined, dataToSend);
  }

  // TODO: решить на каком уровне делать
  // TODO: использовать board setup
  private checkPin(pin: number) {
    if (pin < 0 || pin >= PINS_COUNT) {
      throw new Error(`Pin "${pin}" out of range`);
    }
  }

  // TODO: remove ???
  private updateCurrentState(pin: number, newValue: boolean) {
    this.currentState = updateBitInByte(this.currentState, pin, newValue);
  }

  // /**
  //  * Helper function to set/clear one bit in a bitmask.
  //  * @param  {number}            current The current bitmask.
  //  * @param  {number}            pin     The bit-number in the bitmask.
  //  * @param  {boolean}           value   The new value for the bit. (true=set, false=clear)
  //  * @return {number}                    The new (modified) bitmask.
  //  */
  // private updatePinInBitMask(current: number, pin: number, value: boolean): number{
  //   return updateBitInByte(current, pin, value);
  // }

}


export default class Factory extends DriverFactoryBase<Pcf8574, Pcf8574ExpanderProps> {
  protected SubDriverClass = Pcf8574;
  protected instanceId = (props: Pcf8574ExpanderProps): string => {
    return `${props.busNum}-${props.address}`;
  }
}
