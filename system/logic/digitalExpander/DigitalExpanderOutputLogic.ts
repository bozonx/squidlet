import {OutputResistorMode} from '../../interfaces/gpioTypes';
import DigitalOutputIo from '../../interfaces/io/DigitalOutputIo';
import DigitalExpanderLogic from './DigitalExpanderLogic';
import QueueOverride from '../../lib/QueueOverride';
import DebounceCall from '../../lib/debounceCall/DebounceCall';
import Context from '../../Context';
import DigitalExpanderDriver from './interfaces/DigitalExpanderDriver';


export default class DigitalExpanderOutputLogic implements DigitalOutputIo {
  private readonly context: Context;
  private readonly logic: DigitalExpanderLogic;
  private readonly writeBufferMs?: number;
  private readonly queue: QueueOverride;
  private readonly debounce = new DebounceCall();
  // temporary state while values are buffering before writing
  private beforeWritingBuffer?: number;
  // temporary state while writing
  private writingTimeBuffer?: number;


  // TODO: использовать props ???
  constructor(driver: DigitalExpanderDriver, logError: (msg: string) => void, writeBufferMs?: number) {
    this.context = context;
    this.logic = logic;
    this.writeBufferMs = writeBufferMs;
    this.queue = new QueueOverride(context.config.config.queueJobTimeoutSec);
  }

  destroy = async () => {
    this.queue.destroy();
    this.debounce.destroy();
  }


  setup(pin: number, initialValue: boolean, outputMode: OutputResistorMode): Promise<void> {
    return this.logic.setupOutput(pin, initialValue, outputMode);
  }

  async getPinResistorMode(pin: number): Promise<OutputResistorMode | undefined> {
    return this.logic.getPinResistorMode(pin) as OutputResistorMode | undefined;
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

}
