import {DigitalExpanderPinSetup} from './interfaces/DigitalExpanderDriver';
import {cloneDeepObject, isEmptyObject} from '../../lib/objects';
import {PinDirection} from '../../interfaces/gpioTypes';
import BufferedQueue from '../../lib/BufferedQueue';
import DebounceCallIncreasing from '../../lib/debounceCall/DebounceCallIncreasing';
import Context from 'system/Context';
import IndexedEvents from '../../lib/IndexedEvents';


type SetupHandler = (initializedPins: number[]) => void;


export default class DigitalExpanderSetupLogic {
  private setupEvent = new IndexedEvents<SetupHandler>();
  private readonly context: Context;
  private setupQueue: BufferedQueue;
  //private writeQueue: BufferedQueue;
  private setupDebounce = new DebounceCallIncreasing();
  // buffer of pins which has to be set up
  // during debounce time or while current setup is writing
  private setupBuffer?: {[index: string]: DigitalExpanderPinSetup};


  constructor(context: Context) {
    this.context = context;
    this.setupQueue = new BufferedQueue(this.context.config.config.queueJobTimeoutSec);
  }


  isPinInitialized(): boolean {
    // TODO: add
  }

  getPinProps(pin: number): DigitalExpanderPinSetup {
    // TODO: add
  }

  onSetup(handler: SetupHandler): number {
    return this.setupEvent.addListener(handler);
  }

  removeListener(handlerIndex: number) {
    this.setupEvent.removeListener(handlerIndex);
  }

  /**
   * Start setup pin.
   * It waits forever while pin has been initialized successfully.
   * Errors are ignored.
   */
  setupPin(pin: number, pinSetup: DigitalExpanderPinSetup): Promise<void> {
    return new Promise<void>(((resolve, reject) => {
      // clear pin before start setup
      this.doClearPin(pin);

      if (!this.setupBuffer) this.setupBuffer = {};

      this.setupBuffer[pin] = pinSetup;

      // listen to event which means pin has been initialized and resolve the promise
      const handlerIndex = this.onPinsInitialized((initializedPins: number[]) => {
        if (!initializedPins.includes(pin)) return;

        this.events.removeListener(handlerIndex);
        resolve();
      });

      // if setup process is in progress then just add a new cb to queue
      if (this.setupQueue.isPending()) {
        this.doSetup()
          .catch(reject);

        return;
      }

      // TODO: может использовать BufferedRequest ???

      // if there isn't any setup process then start a new one via debounce
      // or update debounce cb if some debounce in progress.
      this.setupDebounce.invoke(() => {
        this.doSetup()
          .catch(reject);
      }, this.props.setupDebounceMs)
        .catch(reject);
    }));
  }

  /**
   * Do setup of several buffered pins.
   * If can't do request then it tries it forever.
   * It can be called several times
   * @private
   */
  private async doSetup() {

    // TODO: BufferedQueue сохраняет последний записанный стейт это вообще нужно ???

    // if there aren't any pins to be setup then do nothing.
    if (isEmptyObject(this.setupBuffer)) {
      delete this.setupBuffer;

      return;
    }

    const setupBuffer = cloneDeepObject(this.setupBuffer);
    // delete current buffer that means that it moves to saving buffer
    delete this.setupBuffer;

    try {
      await this.setupQueue.add(async (setupPins) => {
        try {
          await this.props.setup(setupPins);
        }
        catch (e) {
          // ignore error and restore setupBuffer;
          this.setupBuffer = {
            ...setupPins,
            ...this.setupBuffer,
          };

          return;
        }

        this.onSetupSuccess(setupPins);
      }, setupBuffer);
    }
    catch (e) {
      // Queue is cancelled at the moment.
      // Repeat at the next tick.
      setTimeout(() => {
        this.doSetup()
          .catch(this.context.log.debug);
      }, 0);
    }
  }

  private onSetupSuccess(pins: {[index: string]: DigitalExpanderPinSetup}) {
    const initializedPins: number[] = [];

    for (let pinStr of Object.keys(pins)) {
      const pin: number = parseInt(pinStr);

      initializedPins.push(pin);

      if (pins[pin].direction === PinDirection.input) {
        this.inputPins[pin] = true;
      }
      else {
        // TODO: надо как-то просто записать в writeQueue
        this.writtenState[pin] = pins[pin].initialValue || false;
      }
    }

    this.setupEvent.emit(initializedPins);
  }
}
