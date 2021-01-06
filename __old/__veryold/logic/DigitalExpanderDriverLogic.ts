import {
  DigitalExpanderEvents,
  DigitalExpanderPinInitHandler,
  DigitalExpanderPinSetup
} from '__old/system/logic/digitalExpander/interfaces/DigitalExpanderDriver';
import {InputResistorMode, OutputResistorMode, PinDirection} from '__old/system/interfaces/gpioTypes';
import {cloneDeepObject, isEmptyObject} from '../squidlet-lib/src/objects';
import IndexedEventEmitter from '../squidlet-lib/src/IndexedEventEmitter';
import DebounceCallIncreasing from '../../../../squidlet-lib/src/debounceCall/DebounceCallIncreasing';
import Context from 'src/system/Context';
import BufferedQueue from '../../lib/BufferedQueue';
import DigitalExpanderSetupLogic from './DigitalExpanderSetupLogic';


export interface DigitalExpanderSlaveDriverProps {
  setupDebounceMs?: number;
  //pinsCount: number;
  setup: (pins: {[index: string]: DigitalExpanderPinSetup}) => Promise<void>;
  // write only output pins
  writeOutput: (outputPinsData: {[index: string]: boolean}) => Promise<void>;
  // read only input pins
  readAllInputs: () => Promise<{[index: string]: boolean}>;
}

// enum QUEUE_IDS {
//   write,
//   read,
// }
const DEFAULT_SETUP_DEBOUNCE_MS = 10;


export default class DigitalExpanderDriverLogic {
  private readonly context: Context;
  private readonly props: DigitalExpanderSlaveDriverProps;
  private setupLogic!: DigitalExpanderSetupLogic;

  // TODO: review
  private events = new IndexedEventEmitter();
  // TODO: тут нужна очередь ???? может обычная???
  // TODO: для очереди чтения поидее нужно сбрасывать новые запросы пока идет текущий
  //private queue: QueueOverride;
  //private setupQueue: BufferedQueue;
  //private writeQueue: BufferedQueue;
  //private setupDebounce = new DebounceCallIncreasing();
  // TODO: наверное лучше их запрашивать выше или вообще не исползовать
  // TODO: зачем надо если можно запросить pins props???
  // which pins are input
  //private inputPins: {[index: string]: true} = {};
  // state of pins which has been written to IC before
  //private writtenState: {[index: string]: boolean} = {};
  // buffer of pins which has to be set up
  // during debounce time or while current setup is writing
  //private setupBuffer?: {[index: string]: DigitalExpanderPinSetup};
  //private writeBuffer?: {[index: string]: boolean};



  constructor(context: Context, props: DigitalExpanderSlaveDriverProps) {
    this.context = context;
    this.props = {
      ...props,
      setupDebounceMs: (typeof props.setupDebounceMs === 'undefined')
        ? DEFAULT_SETUP_DEBOUNCE_MS
        : props.setupDebounceMs,
    };
    this.setupLogic = new DigitalExpanderSetupLogic(this.context);
    //this.queue = new QueueOverride(this.context.config.config.queueJobTimeoutSec);
    //this.setupQueue = new BufferedQueue(this.context.config.config.queueJobTimeoutSec);
    //this.writeQueue = new BufferedQueue(this.context.config.config.queueJobTimeoutSec);
  }

  destroy() {
    this.events.destroy();
    //this.setupQueue.destroy();
    //this.writeQueue.destroy();
    //this.setupDebounce.destroy();

    //delete this.inputPins;
    //delete this.setupBuffer;
  }


  // setupOutput(
  //   pin: number,
  //   resistor?: OutputResistorMode,
  //   initialValue?: boolean
  // ): Promise<void> {
  //   return this.setupLogic.setupPin(pin, {
  //     direction: PinDirection.output,
  //     initialValue,
  //   });
  // }

  // TODO: можно не делать, вызывать cb выше
  /**
   * Write state of several pins.
   * It skip input pins and pins which hasn't been initialized.
   * State is {pinNumber: true | false}. Pin number starts from 0.
   */
  async writeState(state: {[index: string]: boolean}): Promise<void> {
    // TODO: move logic to output pin logic
    const filteredState: {[index: string]: boolean} = {};
    // filter only initialized output pins
    for (let pinStr of Object.keys(state)) {
      const pin: number = parseInt(pinStr);
      // skip pins which are hasn't been setup or in setup process and input pins.
      if (this.wasPinInitialized(pin) && !this.inputPins[pin]) {
        filteredState[pin] = state[pin];
      }
    }
    // TODO: просто записать, верхний уровень гарантирует что не будет накладок
    await this.writeQueue.add(
      (stateToSave) => this.props.writeOutput(stateToSave),
      filteredState
    );
  }


  ////////// Input's
  // setupInput(
  //   pin: number,
  //   resistor: InputResistorMode,
  //   debounce: number,
  // ): Promise<void> {
  //
  //   // resistor doesn't mater.
  //   return this.setupLogic.setupPin(pin, {
  //     direction: PinDirection.input,
  //     debounce,
  //   });
  // }

  ////////// Common

  // async clearPin(pin: number): Promise<void> {
  //   this.doClearPin(pin);
  // }

  // TODO: review
  getWrittenState(): {[index: string]: boolean} {
    return this.writtenState;
  }

  // onPinsInitialized(cb: DigitalExpanderPinInitHandler): number {
  //   return this.events.addListener(DigitalExpanderEvents.setup, cb);
  // }


  // TODO: review
  // private doClearPin(pin: number) {
  //   delete this.inputPins[pin];
  //   delete this.writtenState[pin];
  //
  //   if (this.setupBuffer) delete this.setupBuffer[pin];
  //   if (this.writeBuffer) delete this.writeBuffer[pin];
  // }


  // getPinDirection(pin: number): PinDirection | undefined {
  //   if (this.inputPins[pin]) {
  //     return PinDirection.input;
  //   }
  //   // TODO: а нужно ли брать пин который не был инициализирован ????
  //   // TODO: или тогда брать то что записывается тоже
  //   else if (this.setupBuffer && this.setupBuffer[pin]) {
  //     return this.setupBuffer[pin].direction;
  //   }
  //   else if (typeof this.writtenState[pin] !== 'undefined') {
  //     return PinDirection.output;
  //   }
  //   // or hasn't been set
  //   return;
  // }

  // TODO: можно брать сохраненный setup пина

  // // TODO: review
  // wasPinInitialized(pin: number): boolean {
  //   return typeof this.inputPins[pin] !== 'undefined'
  //     || typeof this.writtenState[pin] !== 'undefined';
  // }

  // // TODO: review - может брать весь стейт который записывается
  // isPinSettingUp(pin: number): boolean {
  //   if (this.setupBuffer) {
  //     return !!this.setupBuffer[pin];
  //   }
  //
  //   const savingState = this.setupQueue.getSavingState();
  //
  //   if (savingState) {
  //     return !!savingState[pin];
  //   }
  //
  //   return false;
  // }

  //
  // /**
  //  * It waits forever while pin has been initialized.
  //  */
  // private startSetupPin(pin: number, pinSetup: DigitalExpanderPinSetup): Promise<void> {
  //   return new Promise<void>(((resolve, reject) => {
  //     // clear pin before start setup
  //     this.doClearPin(pin);
  //
  //     if (!this.setupBuffer) this.setupBuffer = {};
  //
  //     this.setupBuffer[pin] = pinSetup;
  //
  //     // listen to event which means pin has been initialized and resolve the promise
  //     const handlerIndex = this.onPinsInitialized((initializedPins: number[]) => {
  //       if (!initializedPins.includes(pin)) return;
  //
  //       this.events.removeListener(handlerIndex);
  //       resolve();
  //     });
  //
  //     // if setup process is in progress then just add a new cb to queue
  //     if (this.setupQueue.isPending()) {
  //       this.doSetup()
  //         .catch(reject);
  //
  //       return;
  //     }
  //
  //     // TODO: может использовать BufferedRequest ???
  //
  //     // if there isn't any setup process then start a new one via debounce
  //     // or update debounce cb if some debounce in progress.
  //     this.setupDebounce.invoke(() => {
  //       this.doSetup()
  //         .catch(reject);
  //     }, this.props.setupDebounceMs)
  //       .catch(reject);
  //   }));
  // }
  //
  // /**
  //  * Do setup of several buffered pins.
  //  * If can't do request then it tries it forever.
  //  * It can be called several times
  //  * @private
  //  */
  // private async doSetup() {
  //
  //   // TODO: BufferedQueue сохраняет последний записанный стейт это вообще нужно ???
  //
  //   // if there aren't any pins to be setup then do nothing.
  //   if (isEmptyObject(this.setupBuffer)) {
  //     delete this.setupBuffer;
  //
  //     return;
  //   }
  //
  //   const setupBuffer = cloneDeepObject(this.setupBuffer);
  //   // delete current buffer that means that it moves to saving buffer
  //   delete this.setupBuffer;
  //
  //   try {
  //     await this.setupQueue.add(async (setupPins) => {
  //       try {
  //         await this.props.setup(setupPins);
  //       }
  //       catch (e) {
  //         // ignore error and restore setupBuffer;
  //         this.setupBuffer = {
  //           ...setupPins,
  //           ...this.setupBuffer,
  //         };
  //
  //         return;
  //       }
  //
  //       this.onSetupSuccess(setupPins);
  //     }, setupBuffer);
  //   }
  //   catch (e) {
  //     // Queue is cancelled at the moment.
  //     // Repeat at the next tick.
  //     setTimeout(() => {
  //       this.doSetup()
  //         .catch(this.context.log.debug);
  //     }, 0);
  //   }
  // }
  //
  // private onSetupSuccess(pins: {[index: string]: DigitalExpanderPinSetup}) {
  //   const initializedPins: number[] = [];
  //
  //   for (let pinStr of Object.keys(pins)) {
  //     const pin: number = parseInt(pinStr);
  //
  //     initializedPins.push(pin);
  //
  //     if (pins[pin].direction === PinDirection.input) {
  //       this.inputPins[pin] = true;
  //     }
  //     else {
  //       // TODO: надо как-то просто записать в writeQueue
  //       this.writtenState[pin] = pins[pin].initialValue || false;
  //     }
  //   }
  //
  //   this.events.emit(DigitalExpanderEvents.setup, initializedPins);
  // }

  // /**
  //  * Read input pins state
  //  */
  // doPoll = async (): Promise<void> => {
  //
  //   // TODO: нельзя делать пока не сделался setup хоть одного пина
  //   //       это случай если вообще не была запущенна конфигурация или она в процессе
  //   //       если закончилась инициализация то просто ставим в очередь
  //
  //   const inputChanges: {[index: string]: boolean} = await this.doRead();
  //
  //   if (isEmptyObject(inputChanges)) return;
  //
  //   this.events.emit(DigitalExpanderEvents.change, inputChanges);
  // }
  //
  // onChange(cb: DigitalExpanderDriverHandler): number {
  //   return this.events.addListener(DigitalExpanderEvents.change, cb);
  // }
  //
  // removeListener(handlerIndex: number): void {
  //   this.events.removeListener(handlerIndex);
  // }

  // private doRead(): Promise<{[index: string]: boolean}> {
  //   return new Promise<{[index: string]: boolean}>(((resolve, reject) =>  {
  //     const handlerIndex = this.events.once(
  //       DigitalExpanderEvents.incomeRawData,
  //       resolve
  //     );
  //     // this handler can be overwritten by others
  //     // because of that we use events here
  //     const readHandler = async () => {
  //       const result: {[index: string]: boolean} = await this.props.readInput();
  //
  //       this.events.emit(DigitalExpanderEvents.incomeRawData, result);
  //     };
  //
  //     this.queue.add(readHandler, QUEUE_IDS.read)
  //       .catch((e) => {
  //         this.events.removeListener(handlerIndex);
  //         reject(e);
  //       });
  //   }));
  // }
}
