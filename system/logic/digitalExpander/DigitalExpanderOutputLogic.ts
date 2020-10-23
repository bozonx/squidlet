import BufferedRequest from '../../lib/BufferedRequest';
import BufferedQueue from '../../lib/BufferedQueue';


/**
 * Buffering write requests for 10ms and put requests to queue.
 */
export default class DigitalExpanderOutputLogic {
  private readonly logError: (msg: Error | string) => void;
  private readonly writeCb: (changedState: {[index: string]: boolean}) => Promise<void>;
  private readonly writeBufferMs?: number;
  private readonly bufferedRequest: BufferedRequest;
  private readonly bufferedQueue: BufferedQueue;


  constructor(
    logError: (msg: Error | string) => void,
    writeCb: (changedState: {[index: string]: boolean}) => Promise<void>,
    queueJobTimeoutSec?: number,
    writeBufferMs?: number
  ) {
    this.logError = logError;
    this.writeCb = writeCb;
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

  write(pin: number, value: boolean): Promise<void> {
    // TODO: нужно ли сначала проверить был ли пин инициализирован ???
    //       иначе он просто пропустится и ошибка не поднимится
    return this.writeState({[pin]: value});
  }

  /**
   * Write full or partial state.
   * It skips pins which hasn't been initialized.
   * Returns pin numbers which has been successfully written
   */
  async writeState(partialState: {[index: string]: boolean}): Promise<number[]> {



    // If there is some cb writing or there is a queue then update buffer
    if (this.bufferedQueue.hasQueue()) {
      // add to queue or update queued cb and buffer
      return this.bufferedQueue.add(this.writeCb, partialState);
    }
    // else it is in a buffering state or it is a new request
    return this.bufferedRequest.write(partialState);
  }


  /**
   * Start a new writing. It is called after buffering time.
   */
  private startWriting = (stateToSave: {[index: string]: boolean}) => {
    // first write request will be called write now at the current tick
    this.bufferedQueue.add(this.writeCb, stateToSave)
      .catch(this.logError);
  }

}
