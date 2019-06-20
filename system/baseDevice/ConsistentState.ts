import {StateObject} from '../State';
import System from '../System';
import Promised from '../helpers/Promised';
import QueuedCall from '../helpers/QueuedCall';

export type Initialize = () => Promise<StateObject>;
export type Getter = (paramNames?: string[]) => Promise<StateObject>;
export type Setter = (partialData: StateObject) => Promise<void>;


export default class ConsistentState {
  private readonly system: System;
  private readonly stateCategory: number;
  private readonly deviceId: string;
  private readonly initialize?: Initialize;
  private readonly getter?: Getter;
  private readonly setter?: Setter;
  private readingPromise?: Promised<void>;
  private writingQueuedCall: QueuedCall = new QueuedCall();
  private tmpStateBeforeWriting?: StateObject;


  constructor(
    system: System,
    stateCategory: number,
    deviceId: string,
    initialize?: Initialize,
    getter?: Getter,
    setter?: Setter
  ) {
    this.system = system;
    this.stateCategory = stateCategory;
    this.deviceId = deviceId;
    this.initialize = initialize;
    this.getter = getter;
    this.setter = setter;
  }

  async init() {
    let getter = this.getter;

    if (this.initialize) getter = this.initialize;

    const result: StateObject = await this.requestGetter(getter as Getter);

    this.system.state.updateState(this.stateCategory, this.deviceId, result);
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

  getState(): StateObject {
    return this.system.state.getState(this.stateCategory, this.deviceId) || {};
  }

  /**
   * Read whole state.
   * If getter is set it will call it and return state.
   * If there isn't setter - it will just return current state.
   * If writing is in progress it will return current state which is being writing at the moment
   * If reading is in progress it will wait for current reading request and will return its data
   */
  async loadAll(): Promise<void> {
    if (!this.getter) return;

    if (this.isReading()) {
      // wait for current reading. And throw an error if it throws
      this.readingPromise && await this.readingPromise.promise;

      return;
    }

    const result: StateObject = await this.requestGetter(this.getter);

    this.system.state.updateState(this.stateCategory, this.deviceId, result);
  }

  /**
   * Update state and write it to setter.
   * If writing is in progress then a new writing will be queued.
   * If reading is in progress it will wait for its completion.
   * On error it will return state which was before saving started.
   */
  async write(partialData: StateObject): Promise<void> {
    let oldState = this.getState();

    this.system.state.updateState(this.stateCategory, this.deviceId, partialData);

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

    await this.requestSetter(oldState, partialData);
  }


  private async requestGetter(getter: Getter): Promise<StateObject> {
    if (!this.getter) throw new Error(`No getter: ${this.deviceId}`);

    this.readingPromise = new Promised<void>();
    let result: StateObject;

    // make a request
    try {
      result = await getter();
    }
    catch (err) {
      this.readingPromise.reject(err);

      delete this.readingPromise;

      throw new Error(`Can't fetch device state "${this.deviceId}": ${err}`);
    }

    this.readingPromise.resolve();

    delete this.readingPromise;

    return result;
  }

  /**
   * Write new or add to queue
   */
  private async requestSetter(oldState: StateObject, newPartialData: StateObject): Promise<void> {
    // save old state
    this.tmpStateBeforeWriting = oldState;

    this.writingQueuedCall.onSuccess(() => {
      delete this.tmpStateBeforeWriting;
    });

    this.writingQueuedCall.onError((err: Error) => {
      this.system.log.error(String(err));

      if (!this.tmpStateBeforeWriting) return;

      // restore old state
      this.system.state.updateState(this.stateCategory, this.deviceId, this.tmpStateBeforeWriting);

      delete this.tmpStateBeforeWriting;
    });

    this.writingQueuedCall.onAfterEachSuccess(() => {
      // if writing was success and there is a queue - update old tmp state
      this.tmpStateBeforeWriting = this.getState();
    });

    await this.writingQueuedCall.callIt(async (data?: {[index: string]: any}) => {
      return this.setter && this.setter(data as StateObject);
    }, newPartialData);
  }

}
