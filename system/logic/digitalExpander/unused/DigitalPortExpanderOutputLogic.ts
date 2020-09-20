import QueueOverride from '../QueueOverride';
import {updateBitInByte} from '../binaryHelpers';
import DebounceCall from '../debounceCall/DebounceCall';
import {PinDirection} from '../../../interfaces/gpioTypes';
import {getBitFromByte} from '../../../lib/binaryHelpers';


export default class DigitalPortExpanderOutputLogic {
  private readonly logError: (msg: Error | string) => void;
  private readonly writeCb: (state: number) => Promise<void>;
  private readonly getState: () => number;
  private readonly setState: (wholeState: number) => void;
  private readonly writeBufferMs?: number;
  private readonly queue: QueueOverride;
  private readonly debounce = new DebounceCall();
  // temporary state while values are buffering before writing
  private beforeWritingBuffer?: number;
  // temporary state while writing
  private writingTimeBuffer?: number;


  constructor(
    logError: (msg: Error | string) => void,
    writeCb: (state: number) => Promise<void>,
    getState: () => number,
    setState: (wholeState: number) => void,
    queueJobTimeoutSec?: number,
    writeBufferMs?: number
  ) {
    this.logError = logError;
    this.writeCb = writeCb;
    this.getState = getState;
    this.setState = setState;
    this.writeBufferMs = writeBufferMs;
    this.queue = new QueueOverride(queueJobTimeoutSec);
  }

  destroy() {
    this.queue.destroy();
    this.debounce.destroy();
  }


  isInProgress(): boolean {
    return this.isBuffering() || this.isWriting();
  }

  isBuffering(): boolean {
    return typeof this.beforeWritingBuffer !== 'undefined';
  }

  isWriting(): boolean {
    return this.queue.isPending();
  }

  write(pin: number, value: boolean): Promise<void> {
    // in case it is writing at the moment - save buffer and add cb to queue
    if (this.isWriting()) {
      return this.invokeAtWritingTime(pin, value);
    }
    // start buffering step or update buffer
    else if(this.writeBufferMs) {
      // in buffering case collect data at the buffering time (before writing)
      return this.invokeBuffering(pin, value);
    }
    // else if buffering doesn't set - just start writing
    const stateToWrite = updateBitInByte(this.getState(), pin, value);

    return this.startWriting(stateToWrite);
  }

  /**
   * Force write full state
   */
  async writeState(state: number): Promise<void> {
    // if buffering time - clear buffer and start write immediately
    if (this.isBuffering()) {
      this.debounce.clear();

      delete this.beforeWritingBuffer;
    }

    // in case it is writing at the moment - replace buffer and add cb to queue
    if (this.isWriting()) {
      // TODO: review
      this.writingTimeBuffer = state;
      // collect data into buffer

      // add to queue. It will be called after current writing has been done
      return this.queue.add(this.doWriteCb);
    }
    // else if writing isn't processing - just start a new writing
    return this.startWriting(state);
  }

  cancel() {
    this.debounce.clear();
    this.queue.stop();

    delete this.beforeWritingBuffer;
    delete this.writingTimeBuffer;
  }


  /**
   * This method is called while buffering time.
   * All the changes are buffered and only the last one will be written.
   */
  private invokeBuffering(pin: number, value: boolean): Promise<void> {
    // collect data into buffer
    if (typeof this.beforeWritingBuffer === 'undefined') this.beforeWritingBuffer = this.getState();
    // set value to buffer
    this.beforeWritingBuffer = updateBitInByte(this.beforeWritingBuffer, pin, value);
    // only the last one cb will be called
    return this.debounce.invoke(() => {
      if (typeof this.beforeWritingBuffer === 'undefined') {
        return this.logError(`No buffer`);
      }

      const lastBufferedState: number = this.beforeWritingBuffer;
      // remove buffer which was used before writing has been started
      delete this.beforeWritingBuffer;

      // flush buffer which has been collected at buffering time
      this.startWriting(lastBufferedState)
        .catch(this.logError);
    }, this.writeBufferMs);
  }

  /**
   * Add writing to queue while current writing is in progress.
   * It can be called several times.
   */
  private invokeAtWritingTime(pin: number, value: boolean): Promise<void> {
    if (typeof this.writingTimeBuffer === 'undefined') {
      throw new Error(`no writingTimeBuffer`);
    }

    this.writingTimeBuffer = updateBitInByte(this.writingTimeBuffer, pin, value);
    // collect data into buffer

    // add to queue. It will be called after current writing has been done
    return this.queue.add(this.doWriteCb);
  }

  /**
   * Start a new writing. It has to be called only once.
   */
  private startWriting(stateToSave: number): Promise<void> {
    this.writingTimeBuffer = stateToSave;

    return this.queue.add(this.doWriteCb);
  }

  private doWriteCb = async () => {
    if (typeof this.writingTimeBuffer === 'undefined') {
      throw new Error(`no writingTimeBuffer`);
    }

    const state: number = this.writingTimeBuffer;

    try {
      await this.writeCb(state);
    }
    catch(e) {
      delete this.writingTimeBuffer;
      // the queue will be canceled
      throw e;
    }

    if (!this.queue.hasQueue()) {
      // remove buffer if there aren't no queue
      delete this.writingTimeBuffer;
    }

    // set a new state which has been just saved
    this.setState(state);
  }







  ////////////////// FROM driver

  /**
   * Listen to changes of pin after edge and debounce were processed.
   */
  onChange(pin: number, handler: ChangeHandler): number {
    this.checkPinRange(pin);

    return this.expanderInput.onChange(pin, handler);
  }

  removeListener(handlerIndex: number) {
    this.expanderInput.removeListener(handlerIndex);
  }

  /**
   * Poll expander manually.
   */
  pollOnce = (): Promise<void> => {
    // it is no need to do poll while initialization time because it will be done after initialization
    if (!this.initIcLogic.wasInitialized) return Promise.resolve();

    return this.i2c.pollOnce();
  }

  private startFeedback() {
    // if I2C driver doesn't have feedback then it doesn't need to be setup
    if (!this.i2c.hasFeedback()) return;

    this.i2c.addListener(this.handleIcStateChange);
    // make first request and start handle feedback
    this.i2c.startFeedback();
  }

  private handleIcStateChange = (data: Uint8Array) => {

    console.log('------- handleIcStateChange ---------', data)

    if (!data || data.length !== DATA_LENGTH) {
      return this.log.error(`PCF8574Driver: Incorrect data length has been received`);
    }

    const receivedByte: number = data[0];

    // update values add rise change event of input pins which are changed
    for (let pin = 0; pin < PINS_COUNT; pin++) {
      // skip not input pins
      if (this.directions[pin] !== PinDirection.input) continue;

      const newValue: boolean = getBitFromByte(receivedByte, pin);

      this.expanderInput.incomeState(pin, newValue, this.pinDebounces[pin]);
    }
  }

}
