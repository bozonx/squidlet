import {DigitalExpanderPinSetup} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/logic/digitalExpander/interfaces/DigitalExpanderDriver.js';
import {PinDirection} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/gpioTypes.js';
import BufferedQueue from '../../../../../squidlet-lib/src/BufferedQueue';
import Context from 'src/system/Context';
import IndexedEvents from '../../../../../squidlet-lib/src/IndexedEvents';
import BufferedRequest from '../../../../../squidlet-lib/src/BufferedRequest';
import {cloneDeepObject} from '../../../../../squidlet-lib/src/objects';


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
    return this.bufferedRequest.isItemBuffering(pin)
      || this.setupQueue.isItemPending(pin);
  }

  isPinBuffering(pin: number): boolean {
    return this.bufferedRequest.isItemBuffering(pin);
  }


  /**
   * It returns state which is buffering or writing or which has been written.
   * Check the state via wasPinInitialized() and isPinSettingUp()
   */
  getAllPinsProps(): {[index: string]: DigitalExpanderPinSetup} {
    const buffer = this.bufferedRequest.getBuffer();

    if (buffer) return buffer;

    return this.setupQueue.getState();
  }

  /**
   * It returns state which is buffering or writing or which has been written.
   * Check the state via wasPinInitialized() and isPinSettingUp()
   */
  getPinProps(pin: number): DigitalExpanderPinSetup | undefined {
    const buffer = this.bufferedRequest.getBuffer();

    if (buffer) return buffer[pin];

    return this.setupQueue.getState()[pin];
  }

  /**
   * It returns state which is buffering or writing or which has been written.
   * Check the state via wasPinInitialized() and isPinSettingUp()
   */
  getPinDirection(pin: number): PinDirection | undefined {
    const pinProps = this.getPinProps(pin);

    if (pinProps) {
      return pinProps.direction;
    }

    return;
  }

  onSetupDone(handler: SetupHandler): number {
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
      // TODO: зависнет если очистить pin
      // listen to event which means pin has been initialized and resolve the promise
      const handlerIndex = this.onSetupDone((initializedPins: number[]) => {
        if (!initializedPins.includes(pin)) return;

        this.removeListener(handlerIndex);
        resolve();
      });

      // add pin to buffer. After timeout the writing process will be started.
      this.bufferedRequest.write({[pin]: pinSetup})
        .catch(this.context.log.debug);
    });
  }

  async clearPin(pin: number): Promise<void> {
    this.doClearPin(pin);
  }


  private handleDebounceEnd = async (setupBuffer: {[index: string]: DigitalExpanderPinSetup}) => {
    try {
      await this.setupQueue.add(async (setupPins) => {
        await this.props.doSetup(setupPins);

        this.setupEvent.emit(Object.keys(setupPins).map(Number));
      }, setupBuffer);
    }
    catch (e) {
      const prevState = cloneDeepObject(this.setupQueue.getSavingState());

      if (!prevState) return;
      // Queue is cancelled at the moment.
      // Repeat at the next tick.
      setTimeout(() => {
        this.handleDebounceEnd(prevState)
          .catch(this.context.log.debug);
      }, 0);
    }
  }

  private doClearPin(pin: number) {
    this.bufferedRequest.clearItem(pin);
    this.setupQueue.clearItem(pin);
  }

}
