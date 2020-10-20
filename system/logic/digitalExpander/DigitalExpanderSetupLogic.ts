import {DigitalExpanderPinSetup} from './interfaces/DigitalExpanderDriver';
import {PinDirection} from '../../interfaces/gpioTypes';
import BufferedQueue from '../../lib/BufferedQueue';
import Context from 'system/Context';
import IndexedEvents from '../../lib/IndexedEvents';
import BufferedRequest from '../../lib/BufferedRequest';


type SetupHandler = (initializedPins: number[]) => void;

interface Props {
  doSetup: (pins: {[index: string]: DigitalExpanderPinSetup}) => Promise<void>;
  setupDebounceMs?: number;
}

const DEFAULT_SETUP_DEBOUNCE_MS: number = 10;


export default class DigitalExpanderSetupLogic {
  private readonly context: Context;
  private readonly props: Props;
  private readonly setupEvent = new IndexedEvents<SetupHandler>();
  private readonly setupQueue: BufferedQueue;
  private readonly bufferedRequest: BufferedRequest;

  //private setupDebounce = new DebounceCallIncreasing();
  // buffer of pins which has to be set up
  // during debounce time or while current setup is writing
  //private setupBuffer?: {[index: string]: DigitalExpanderPinSetup};


  constructor(context: Context, props: Props) {
    this.context = context;
    this.props = props;
    this.setupQueue = new BufferedQueue(this.context.config.config.queueJobTimeoutSec);

    const setupDebounceMs = (typeof props.setupDebounceMs === 'undefined')
      ? DEFAULT_SETUP_DEBOUNCE_MS
      : props.setupDebounceMs;

    this.bufferedRequest = new BufferedRequest(this.handleDebounceEnd, setupDebounceMs);
  }

  destroy() {
    this.setupEvent.destroy();
    this.setupQueue.destroy();
    this.bufferedRequest.destroy();
  }


  wasPinInitialized(pin: number): boolean {
    return Boolean(this.setupQueue.getSavedState()[pin]);
  }

  isPinSettingUp(pin: number): boolean {
    return Boolean(
      this.bufferedRequest.isItemBuffering(pin)
      || this.setupQueue.isItemPending(pin)
    );
  }

  getPinDirection(pin: number): PinDirection | undefined {
    if (this.inputPins[pin]) {
      return PinDirection.input;
    }
      // TODO: а нужно ли брать пин который не был инициализирован ????
    // TODO: или тогда брать то что записывается тоже
    else if (this.setupBuffer && this.setupBuffer[pin]) {
      return this.setupBuffer[pin].direction;
    }
    else if (typeof this.writtenState[pin] !== 'undefined') {
      return PinDirection.output;
    }
    // or hasn't been set
    return;
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
    return new Promise<void>((resolve, reject) => {
      // clear pin before start setup
      this.doClearPin(pin);

      // TODO: use setup buffer

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
    });
  }

  async clearPin(pin: number): Promise<void> {
    this.doClearPin(pin);
  }


  private handleDebounceEnd = async (setupBuffer: {[index: string]: DigitalExpanderPinSetup}) => {
    try {
      await this.setupQueue.add(async (setupPins) => {
        await this.props.doSetup(setupPins);

        this.onSetupSuccess(setupPins);
      }, setupBuffer);
    }
    catch (e) {
      // Queue is cancelled at the moment.
      // Repeat at the next tick.
      setTimeout(() => {
        // TODO: нужно взять весь последний стейт очереди
        this.handleDebounceEnd()
          .catch(this.context.log.debug);
      }, 0);
    }
  }

  // TODO: review
  private doClearPin(pin: number) {
    delete this.inputPins[pin];
    delete this.writtenState[pin];

    if (this.setupBuffer) delete this.setupBuffer[pin];
    if (this.writeBuffer) delete this.writeBuffer[pin];
  }

  // TODO: strong review
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
