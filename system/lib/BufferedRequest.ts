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
  }


  isBuffering(): boolean {
    return !!this.beforeWritingBuffer;
  }

  async write(state: {[index: string]: any}): Promise<void> {
    // in case it is writing at the moment - save buffer and add cb to queue
    if (this.isBuffering()) {
      return this.invokeBuffering(state);
    }
    // else if buffering doesn't set - just start writing
    return this.startBuffering(state);
  }

  cancel() {
    this.debounce.clear();

    delete this.beforeWritingBuffer;
  }

  flush() {
    this.debounce.clear();
    this.doWriteCb();
  }


  private startBuffering(state: {[index: string]: any}) {
    if (!this.beforeWritingBuffer) this.beforeWritingBuffer = state;

    return this.debounce.invoke(this.doWriteCb, this.writeBufferMs);
  }

  /**
   * This method is called while buffering time.
   * All the changes are buffered and only the last one will be written.
   */
  private async invokeBuffering(state: {[index: string]: any}): Promise<void> {
    // the buffer has to be set
    if (typeof this.beforeWritingBuffer === 'undefined') return;
    // set value to buffer
    this.beforeWritingBuffer = {
      ...this.beforeWritingBuffer,
      ...state,
    };
    // only the last one cb will be called
    return this.debounce.invoke(this.doWriteCb, this.writeBufferMs);
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
