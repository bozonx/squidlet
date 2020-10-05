import {
  DigitalExpanderDriverHandler,
  DigitalExpanderEvents,
  DigitalExpanderInputDriver,
  DigitalExpanderOutputDriver,
  DigitalExpanderPinInitHandler,
  DigitalExpanderPinSetup
} from 'system/logic/digitalExpander/interfaces/DigitalExpanderDriver';
import {InputResistorMode, OutputResistorMode, PinDirection} from 'system/interfaces/gpioTypes';
import {cloneDeepObject, isEmptyObject} from 'system/lib/objects';
import {bitsToBytes} from 'system/lib/binaryHelpers';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import QueueOverride from 'system/lib/QueueOverride';
import DebounceCallIncreasing from 'system/lib/debounceCall/DebounceCallIncreasing';
import Context from 'system/Context';


export interface DigitalExpanderSlaveDriverProps {
  setupDebounceMs?: number;
  //pinsCount: number;
  setup: (pins: {[index: string]: DigitalExpanderPinSetup}) => Promise<void>;
  // write only output pins
  writeOutput: (outputPinsData: {[index: string]: boolean}) => Promise<void>;
  // read only input pins
  readInput: () => Promise<{[index: string]: boolean}>;
}

enum QUEUE_IDS {
  setup,
  write,
  read,
}
const DEFAULT_SETUP_DEBOUNCE_MS = 10;


export default class DigitalExpanderDriverLogic
  implements DigitalExpanderOutputDriver, DigitalExpanderInputDriver
{
  private readonly context: Context;
  private readonly props: DigitalExpanderSlaveDriverProps;

  // TODO: тут нужна очередь ???? может обычная???
  // TODO: для очереди чтения поидее нужно сбрасывать новые запросы пока идет текущий

  private queue: QueueOverride;
  private events = new IndexedEventEmitter();
  // which pins are input
  private inputPins: {[index: string]: true} = {};
  // state of pins which has been written to IC before
  private writtenState: {[index: string]: boolean} = {};
  // buffer of pins which has to be set up
  private setupBuffer?: {[index: string]: DigitalExpanderPinSetup};
  private writeBuffer?: {[index: string]: boolean};
  private setupDebounce = new DebounceCallIncreasing();


  constructor(context: Context, props: DigitalExpanderSlaveDriverProps) {
    this.context = context;
    this.props = {
      ...props,
      setupDebounceMs: (typeof props.setupDebounceMs === 'undefined')
        ? DEFAULT_SETUP_DEBOUNCE_MS
        : props.setupDebounceMs,
    };
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

    return this.queue.add(this.doWrite, QUEUE_IDS.write);
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

    const inputChanges: {[index: string]: boolean} = await this.doRead();

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
    this.doClearPin(pin);
  }

  wasPinInitialized(pin: number): boolean {
    return typeof this.inputPins[pin] !== 'undefined'
      || typeof this.writtenState[pin] !== 'undefined';
  }

  getWrittenState(): {[index: string]: boolean} {
    return this.writtenState;
  }

  onPinInitialized(cb: DigitalExpanderPinInitHandler): number {
    return this.events.addListener(DigitalExpanderEvents.setup, cb);
  }

  getPinDirection(pin: number): PinDirection | undefined {
    if (this.inputPins[pin]) {
      return PinDirection.input;
    }
    else if (this.setupBuffer && this.setupBuffer[pin]) {
      return this.setupBuffer[pin].direction;
    }
    else if (typeof this.writtenState[pin] !== 'undefined') {
      return PinDirection.output;
    }
    // or hasn't been set
    return;
  }


  /**
   * It waits forever while pin has been initialized.
   */
  private startSetupPin(pin: number, pinSetup: DigitalExpanderPinSetup): Promise<void> {
    return new Promise<void>(((resolve, reject) => {
      // clear pin before start setup
      this.doClearPin(pin);

      if (!this.setupBuffer) this.setupBuffer = {};

      this.setupBuffer[pin] = pinSetup;

      // listen to event which means pin has been initialized and resolve the promise
      const handlerIndex = this.onPinInitialized((initializedPins: number[]) => {
        if (!initializedPins.includes(pin)) return;

        this.events.removeListener(handlerIndex);
        resolve();
      });

      this.setupDebounce.invoke(() => {
        this.doSetup()
          .catch(this.context.log.error);
      }, this.props.setupDebounceMs)
        .catch(reject);
    }));
  }

  // TODO: review
  private async doSetup() {
    // it means some pins has been cleaned
    if (!this.setupBuffer || isEmptyObject(this.setupBuffer)) return;

    const setupBuffer: {[index: string]: DigitalExpanderPinSetup} = cloneDeepObject(
      this.setupBuffer
    );

    delete this.setupBuffer;

    try {
      await this.queue.add(() => this.props.setup(setupBuffer), QUEUE_IDS.setup);
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

  private async doWrite() {
    // TODO: сохранить в буфер
    //       после успешной записи сохранить в стейт
    //       запись делать в очереди. При ошибке очистить буфер

    // TODO: когда очистить writeBuffer

    if (!this.writeBuffer) throw new Error(`No writeBuffer`);

    try {
      await this.props.writeOutput(this.writeBuffer);
    }
    catch (e) {
      delete this.writeBuffer;

      throw e;
    }

    delete this.writeBuffer;
  }

  // TODO: review
  private doRead(): Promise<{[index: string]: boolean}> {
    return new Promise<{[index: string]: boolean}>(((resolve, reject) =>  {
      const handlerIndex = this.events.once(
        DigitalExpanderEvents.incomeRawData,
        resolve
      );
      // this handler can be overwritten by others
      // because of that we use events here
      const readHandler = async () => {
        const result: {[index: string]: boolean} = await this.props.readInput();

        this.events.emit(DigitalExpanderEvents.incomeRawData, result);
      };

      this.queue.add(readHandler, QUEUE_IDS.read)
        .catch((e) => {
          this.events.removeListener(handlerIndex);
          reject(e);
        });
    }));
  }

  doClearPin(pin: number) {
    delete this.inputPins[pin];
    delete this.writtenState[pin];

    if (this.setupBuffer) delete this.setupBuffer[pin];
    if (this.writeBuffer) delete this.writeBuffer[pin];
  }

}
