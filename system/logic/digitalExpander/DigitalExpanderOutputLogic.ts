import {OutputResistorMode} from '../../interfaces/gpioTypes';
import DigitalOutputIo from '../../interfaces/io/DigitalOutputIo';
import QueueOverride from '../../lib/QueueOverride';
import DebounceCall from '../../lib/debounceCall/DebounceCall';
import {DigitalExpanderOutputDriver} from './interfaces/DigitalExpanderDriver';
//import Context from '../../Context';


interface Props {
  writeBufferMs?: number;
}


export default class DigitalExpanderOutputLogic implements DigitalOutputIo {
  //private readonly context: Context;
  private readonly driver: DigitalExpanderOutputDriver;
  private readonly writeBufferMs?: number;
  private readonly props: Props;
  private readonly queue: QueueOverride;
  private readonly debounce = new DebounceCall();
  // temporary state while values are buffering before writing
  private beforeWritingBuffer?: number;
  // temporary state while writing
  private writingTimeBuffer?: number;


  constructor(
    driver: DigitalExpanderOutputDriver,
    logError: (msg: string) => void,
    props: Props
  ) {
    //this.context = context;
    this.driver = driver;
    this.props = props;
    this.queue = new QueueOverride(context.config.config.queueJobTimeoutSec);
  }

  destroy = async () => {
    this.queue.destroy();
    this.debounce.destroy();
  }


  /**
   * Get the last actual state of all the pins input and output
   */
  getState(): {[index: string]: boolean} {

  }


  setup(pin: number, initialValue: boolean, outputMode: OutputResistorMode): Promise<void> {
    return this.logic.setupOutput(pin, initialValue, outputMode);
  }

  async getPinResistorMode(pin: number): Promise<OutputResistorMode | undefined> {
    //return this.logic.getPinResistorMode(pin) as OutputResistorMode | undefined;
  }

  // // output and input pins can be read
  // read(pin: number): Promise<boolean>;

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

  clearPin(pin: number): Promise<void> {

  }

  clearAll(): Promise<void> {

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
