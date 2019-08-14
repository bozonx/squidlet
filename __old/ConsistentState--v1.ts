import Promised from '../system/helpers/Promised';
import QueuedCall from './QueuedCall';
import {mergeDeep} from '../system/helpers/collections';
import {Dictionary} from '../system/interfaces/Types';


export type Initialize = () => Promise<Dictionary>;
export type Getter = () => Promise<Dictionary>;
export type Setter = (partialData: Dictionary) => Promise<void>;


/**
 * State which is consistent while reading and writing.
 */
export default class ConsistentState {
  private readonly logError: (msg: string) => void;
  // getter of local state
  private readonly stateGetter: () => Dictionary;
  // updater of local state
  private readonly stateUpdater: (partialState: Dictionary) => void;
  private readonly initialize?: Initialize;
  private readonly getter?: Getter;
  private readonly setter?: Setter;
  private readingPromise?: Promised<void>;
  private writingQueuedCall: QueuedCall = new QueuedCall();
  private tmpStateBeforeWriting?: Dictionary;


  constructor(
    logError: (msg: string) => void,
    stateGetter: () => Dictionary,
    stateUpdater: (partialState: Dictionary) => void,
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

    const result: Dictionary = await this.requestGetter(getter as Getter);

    this.stateUpdater(result);
  }

  // TODO: test
  destroy() {
    this.writingQueuedCall.destroy();
    delete this.readingPromise;
    delete this.writingQueuedCall;
    delete this.tmpStateBeforeWriting;
  }


  // TODO: test
  isWriting(): boolean {
    return this.writingQueuedCall.isExecuting();
  }

  isReading(): boolean {
    return Boolean(this.readingPromise);
  }

  // TODO: test
  getState(): Dictionary {
    return this.stateGetter();
  }

  // TODO: test
  // TODO: review
  setIncomeState(partialState: Dictionary) {
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
   * Read whole state manually.
   * It useful when for example you want to make state actual after connection lost.
   * But usually it doesn't need because it's better to pass income state which you received by listening
   * to income data events to setIncomeState() method.
   * The logic of this method:
   * * If getter is set it will be called
   * * If there isn't any getter - it will do nothing
   * * If reading is in progress it will return promise of current reading process
   */
  async load(): Promise<void> {
    if (!this.getter) return;

    // TODO: ??? If writing is in progress it will return current state which is being writing at the moment

    if (this.isReading()) {
      // wait for current reading. And throw an error if it throws
      return this.readingPromise && this.readingPromise.promise;
    }

    const result: Dictionary = await this.requestGetter(this.getter);

    this.stateUpdater(result);
  }

  /**
   * Update local state and pass it to setter.
   * Call it when you want to set a new state e.g when some button changed its state.
   * The logic:
   * * If writing is in progress then a new writing will be queued.
   * * If reading is in progress it will wait for its completion.
   * * On error it will return state which was before saving started.
   */
  async write(partialData: Dictionary): Promise<void> {
    let oldState = this.getState();

    // update local state at the beginning of process
    this.stateUpdater(partialData);

    // if mode without setter - do noting else updating local state
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

    // TODO: правильно ли обновлять стейт если уже идет запись???
    // save old state
    this.tmpStateBeforeWriting = oldState;

    // do writing request any way if it is a new request or there is writing is in progress
    await this.requestSetter(partialData);
  }


  // TODO: test
  private async requestGetter(getter: Getter): Promise<Dictionary> {
    //if (!this.getter) throw new Error(`No getter`);

    this.readingPromise = new Promised<void>();
    let result: Dictionary;

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

  // TODO: test
  /**
   * Write new or add to queue
   */
  private async requestSetter(newPartialData: Dictionary): Promise<void> {
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
      return this.setter && this.setter(data as Dictionary);
    }, newPartialData);
  }

}