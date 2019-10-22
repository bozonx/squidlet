import RequestQueue from '../../../system/lib/RequestQueue';
import {updateBitInByte} from '../../../system/lib/binaryHelpers';


export default class ExpanderLogic {
  private queue: RequestQueue;
  private writeBufferMs?: number;
  private writeBuffer?: number;


  constructor(logError: (msg: string) => void, queueJobTimeoutSec: number, writeBufferMs?: number) {
    this.queue = new RequestQueue(logError, queueJobTimeoutSec);
    this.writeBufferMs = writeBufferMs;
  }

  destroy() {

  }


  /**
   * Just update state and don't save it to IC
   */
  updateState(pin: number, value: boolean) {

  }

  write(pin: number, value: boolean): Promise<void> {
    if (this.writeBufferMs) {
      if (typeof this.writeBuffer === 'undefined') this.writeBuffer = 0;

      this.writeBuffer = updateBitInByte(this.writeBuffer, pin, value);
    }



    // TODO: add logic without buffer

  }

}
