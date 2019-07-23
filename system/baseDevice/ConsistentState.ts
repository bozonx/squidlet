import Promised from '../helpers/Promised';
import QueuedCall from '../helpers/QueuedCall';
import {mergeDeep} from '../helpers/collections';
import {JsonTypes} from '../interfaces/Types';


export type ConsistentStateData = {[index: string]: JsonTypes};
export type Initialize = () => Promise<ConsistentStateData>;
export type Getter = () => Promise<ConsistentStateData>;
export type Setter = (partialData: ConsistentStateData) => Promise<void>;


/**
 * State which is consistent while reading and writing.
 */
export default class ConsistentState {
  private readonly logError: (msg: string) => void;
  private readonly stateGetter: () => ConsistentStateData;
  private readonly stateUpdater: (partialState: ConsistentStateData) => void;
  private readonly initialize?: Initialize;
  private readonly getter?: Getter;
  private readonly setter?: Setter;
  private readingPromise?: Promised<void>;
  private writingQueuedCall: QueuedCall = new QueuedCall();
  private tmpStateBeforeWriting?: ConsistentStateData;


  constructor(
    logError: (msg: string) => void,
    stateGetter: () => ConsistentStateData,
    stateUpdater: (partialState: ConsistentStateData) => void,
    initialize?: Initialize,
    getter?: Getter,
    setter?: Setter
  ) {
    this.logError = logError;

    this.stateGetter = stateGetter;
    this.stateUpdater = stateUpdater;
    this.initialize = initialize;
    this.getter = getter;
    this.setter = setter;
  }

  async init() {
    if (!this.initialize && !this.getter) throw new Error(`There aren't any getter or initialize callbacks`);

    let getter = this.getter;

    if (this.initialize) getter = this.initialize;

    const result: ConsistentStateData = await this.requestGetter(getter as Getter);

    this.stateUpdater(result);
  }

  destroy() {
    this.writingQueuedCall.destroy();
    delete this.readingPromise;
    delete this.writingQueuedCall;
    delete this.tmpStateBeforeWriting;
  }


  isWriting(): boolean {
    return this.writingQueuedCall.isExecuting();
  }

  isReading(): boolean {
    return Boolean(this.readingPromise);
  }

  getState(): ConsistentStateData {
    return this.stateGetter();
  }

  setIncomeState(partialState: ConsistentStateData) {
    if (this.isReading()) {
      // do nothing if force reading is in progress. It will return the truly state
      return;
    }
    else if (this.isWriting()) {
      this.stateUpdater(partialState);

      this.tmpStateBeforeWriting = mergeDeep(partialState, this.tmpStateBeforeWriting);

      return;
    }

    // there aren't reading and writing - just update
    this.stateUpdater(partialState);
  }

  /**
   * Read whole state.
   * If getter is set it will call it and return state.
   * If there isn't setter - it will just return current state.
   * If writing is in progress it will return current state which is being writing at the moment
   * If reading is in progress it will wait for current reading request and will return its data
   */
  async load(): Promise<void> {
    if (!this.getter) return;

    if (this.isReading()) {
      // wait for current reading. And throw an error if it throws
      this.readingPromise && await this.readingPromise.promise;

      return;
    }

    const result: ConsistentStateData = await this.requestGetter(this.getter);

    this.stateUpdater(result);
  }

  /**
   * Update state and write it to setter.
   * If writing is in progress then a new writing will be queued.
   * If reading is in progress it will wait for its completion.
   * On error it will return state which was before saving started.
   */
  async write(partialData: ConsistentStateData): Promise<void> {
    let oldState = this.getState();

    this.stateUpdater(partialData);

    // if mode without setter - just update state and rise an event
    if (!this.setter) return;

    if (this.isReading()) {
      // wait while current reading is completed
      try {
        this.readingPromise && await this.readingPromise.promise;
      }
      catch (err) {
        // do nothing, do saving anyway.
      }

      oldState = this.getState();
    }

    // save old state
    this.tmpStateBeforeWriting = oldState;

    await this.requestSetter(partialData);
  }


  private async requestGetter(getter: Getter): Promise<ConsistentStateData> {
    if (!this.getter) throw new Error(`No getter`);

    this.readingPromise = new Promised<void>();
    let result: ConsistentStateData;

    // make a request
    try {
      result = await getter();
    }
    catch (err) {
      this.readingPromise.reject(err);

      delete this.readingPromise;

      throw new Error(`Can't fetch device state: ${err}`);
    }

    this.readingPromise.resolve();

    delete this.readingPromise;

    return result;
  }

  /**
   * Write new or add to queue
   */
  private async requestSetter(newPartialData: ConsistentStateData): Promise<void> {
    this.writingQueuedCall.onSuccess(() => {
      delete this.tmpStateBeforeWriting;
    });

    this.writingQueuedCall.onError((err: Error) => {
      this.logError(String(err));

      if (!this.tmpStateBeforeWriting) return;

      // restore old state
      this.stateUpdater(this.tmpStateBeforeWriting);

      delete this.tmpStateBeforeWriting;
    });

    this.writingQueuedCall.onAfterEachSuccess(() => {
      // if writing was success and there is a queue - update old tmp state
      this.tmpStateBeforeWriting = this.getState();
    });

    await this.writingQueuedCall.callIt(async (data?: {[index: string]: any}) => {
      return this.setter && this.setter(data as ConsistentStateData);
    }, newPartialData);
  }

}
