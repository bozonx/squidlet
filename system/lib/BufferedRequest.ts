import DebounceCall from './debounceCall/DebounceCall';


export default class BufferedRequest {
  private readonly writeCb: (state: {[index: string]: boolean}) => void;
  private readonly writeBufferMs: number;
  private readonly debounce = new DebounceCall();
  // temporary state while values are buffering before writing
  private buffer?: {[index: string]: any};


  constructor(
    writeCb: (state: {[index: string]: boolean}) => void,
    writeBufferMs: number = 0
  ) {
    this.writeCb = writeCb;
    this.writeBufferMs = writeBufferMs;
  }

  destroy() {
    this.debounce.destroy();

    delete this.buffer;
  }


  isBuffering(): boolean {
    return !!this.buffer;
  }

  getBuffer(): {[index: string]: any} | undefined {
    return this.buffer;
  }

  /**
   * Call this as many times as you wish
   */
  async write(state: {[index: string]: any}): Promise<void> {
    // if cb has to be called right now
    if (this.writeBufferMs <= 0) {
      this.writeCb(state);

      return;
    }
    // second and further requests
    else if (this.buffer) {
      // update buffered state
      this.buffer = {
        ...this.buffer,
        ...state,
      };
    }
    // a new request, make a new buffer
    else {
      this.buffer = { ...state };
    }

    return this.debounce.invoke(this.doWriteCb, this.writeBufferMs);
  }

  cancel() {
    this.debounce.clear();

    delete this.buffer;
  }

  flush() {
    this.debounce.clear();
    this.doWriteCb();
  }


  private doWriteCb = () => {
    // if it was cancelled
    if (typeof this.buffer === 'undefined') return;

    const lastBufferedState = this.buffer;
    // remove buffer which was used before writing has been started
    delete this.buffer;

    this.writeCb(lastBufferedState);
  }

}
