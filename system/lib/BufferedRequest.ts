import DebounceCall from './debounceCall/DebounceCall';


export default class BufferedRequest {
  private readonly writeCb: (state: {[index: string]: boolean}) => void;
  private readonly writeBufferMs?: number;
  private readonly debounce = new DebounceCall();
  // temporary state while values are buffering before writing
  private beforeWritingBuffer?: {[index: string]: any};


  constructor(
    writeCb: (state: {[index: string]: boolean}) => void,
    writeBufferMs?: number
  ) {
    this.writeCb = writeCb;
    this.writeBufferMs = writeBufferMs;
  }

  destroy() {
    this.debounce.destroy();

    delete this.beforeWritingBuffer;
  }


  isBuffering(): boolean {
    return !!this.beforeWritingBuffer;
  }

  async write(state: {[index: string]: any}): Promise<void> {
    // TODO: если this.writeBufferMs = 0 то можно сразу выполнять

    if (this.beforeWritingBuffer) {
      // second and further requests
      // update buffered state
      this.beforeWritingBuffer = {
        ...this.beforeWritingBuffer,
        ...state,
      };
    }
    else {
      // a new request, make a new buffer
      this.beforeWritingBuffer = { ...state };
    }

    return this.debounce.invoke(this.doWriteCb, this.writeBufferMs);
  }

  cancel() {
    this.debounce.clear();

    delete this.beforeWritingBuffer;
  }

  flush() {
    this.debounce.clear();
    this.doWriteCb();
  }


  private doWriteCb = () => {
    // the buffer has to be set
    if (typeof this.beforeWritingBuffer === 'undefined') return;

    const lastBufferedState = this.beforeWritingBuffer;
    // remove buffer which was used before writing has been started
    delete this.beforeWritingBuffer;

    this.writeCb(lastBufferedState);
  }

}
