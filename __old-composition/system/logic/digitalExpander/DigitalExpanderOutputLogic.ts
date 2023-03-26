import BufferedRequest from '../../../../../squidlet-lib/src/BufferedRequest';
import BufferedQueue from '../../../../../squidlet-lib/src/BufferedQueue';
import {PinDirection} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/gpioTypes.js';
import {DigitalExpanderPinSetup} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/logic/digitalExpander/interfaces/DigitalExpanderDriver.js';
import {stringArrayToNumber} from '../../../../../squidlet-lib/src/arrays';


/**
 * Buffering write requests for 10ms and put requests to queue.
 */
export default class DigitalExpanderOutputLogic {
  private readonly logError: (msg: Error | string) => void;
  private readonly writeCb: (changedState: {[index: string]: boolean}) => Promise<void>;
  private readonly wasPinInitialized: (pin: number) => boolean;
  private readonly getPinProps: (pin: number) => DigitalExpanderPinSetup | undefined;
  private readonly writeBufferMs?: number;
  private readonly bufferedRequest: BufferedRequest;
  private readonly bufferedQueue: BufferedQueue;


  constructor(
    logError: (msg: Error | string) => void,
    writeCb: (changedState: {[index: string]: boolean}) => Promise<void>,
    wasPinInitialized: (pin: number) => boolean,
    getPinProps: (pin: number) => DigitalExpanderPinSetup | undefined,
    queueJobTimeoutSec?: number,
    writeBufferMs?: number
  ) {
    this.logError = logError;
    this.writeCb = writeCb;
    this.wasPinInitialized = wasPinInitialized;
    this.getPinProps = getPinProps;
    this.writeBufferMs = writeBufferMs;
    this.bufferedRequest = new BufferedRequest(this.startWriting, writeBufferMs);
    this.bufferedQueue = new BufferedQueue(queueJobTimeoutSec);
  }

  destroy() {
    this.bufferedRequest.destroy();
    this.bufferedQueue.destroy();
  }


  /**
   * Get the last actual state of all the output pins.
   * Mixed saved state and a new one.
   */
  getState(): {[index: string]: boolean} {
    return {
      ...this.bufferedQueue.getState(),
      ...this.bufferedRequest.getBuffer(),
    };
  }

  getSavedState(): {[index: string]: boolean} {
    return this.bufferedQueue.getSavedState();
  }

  isInProgress(): boolean {
    return this.isBuffering() || this.isWriting();
  }

  isBuffering(): boolean {
    return this.bufferedRequest.isBuffering();
  }

  isWriting(): boolean {
    return this.bufferedQueue.isPending();
  }

  cancel() {
    this.bufferedRequest.cancel();
    this.bufferedQueue.stop();
  }

  clearPin(pin: number) {
    this.bufferedQueue.clearItem(pin);
  }

  async write(pin: number, value: boolean): Promise<void> {
    if (this.wasPinInitialized(pin)) {
      throw new Error(
        `DigitalExpanderOutputLogic.write: ` +
        `Pin "${pin}" hasn't been initialized yet`
      );
    }

    const pinProps = this.getPinProps(pin);

    if (pinProps && pinProps.direction !== PinDirection.output) {
      throw new Error(`DigitalExpanderOutputLogic.write: Pin "${pin}" isn't output`);
    }

    await this.writeState({[pin]: value});
  }

  /**
   * Write full or partial state.
   * It skips pins which hasn't been initialized.
   * Returns pin numbers which has been successfully written
   */
  async writeState(partialState: {[index: string]: boolean}): Promise<number[]> {
    const filteredState = this.filterInitializedPinsState(partialState);

    // If there is some cb writing or there is a queue then update buffer
    if (this.bufferedQueue.hasQueue()) {
      // add to queue or update queued cb and buffer
      await this.bufferedQueue.add(this.writeCb, filteredState);
    }
    // else it is in a buffering state or it is a new request
    await this.bufferedRequest.write(filteredState);

    return stringArrayToNumber(Object.keys(filteredState));
  }


  /**
   * Start a new writing. It is called after buffering time.
   */
  private startWriting = (stateToSave: {[index: string]: boolean}) => {
    // first write request will be called write now at the current tick
    this.bufferedQueue.add(this.writeCb, stateToSave)
      .catch(this.logError);
  }

  private filterInitializedPinsState(
    partialState: {[index: string]: boolean}
  ): {[index: string]: boolean} {
    const filteredState: {[index: string]: boolean} = {};
    // filter only initialized output pins
    for (let pinStr of Object.keys(partialState)) {
      const pin: number = parseInt(pinStr);
      // skip pins which are hasn't been setup or in setup process and input pins.
      if (this.wasPinInitialized(pin)) {
        const pinProps = this.getPinProps(pin);

        if (pinProps && pinProps.direction === PinDirection.output) {
          filteredState[pin] = partialState[pin];
        }
      }
    }

    return filteredState;
  }

}
