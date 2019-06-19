import {JsonTypes} from '../interfaces/Types';
import Promised from '../helpers/Promised';
import System from '../System';
import {StateObject} from '../State';
import {isEmpty} from '../helpers/lodashLike';
import QueuedCall from '../helpers/QueuedCall';
import {validateParam} from '../helpers/validate';
import {mergeDeep} from '../helpers/collections';
import SchemaElement from '../interfaces/SchemaElement';


export type Initialize = () => Promise<StateObject>;
export type Getter = (paramNames?: string[]) => Promise<StateObject>;
export type Setter = (partialData: StateObject) => Promise<void>;
export type Schema = {[index: string]: SchemaElement};


export default class DeviceState {
  private readonly system: System;
  private readonly schema: Schema;
  private readonly stateCategory: number;
  private readonly deviceId: string;
  private readonly initialize?: Initialize;
  private readonly getter?: Getter;
  private readonly setter?: Setter;
  private readingPromise?: Promised<void>;
  private writingQueuedCall: QueuedCall = new QueuedCall();
  //private tmpWritingPartialState?: StateObject;
  private tmpWritingOldState?: StateObject;
  

  constructor(
    system: System,
    schema: Schema,
    stateCategory: number,
    deviceId: string,
    initialize?: Initialize,
    getter?: Getter,
    setter?: Setter
  ) {
    this.system = system;
    this.schema = schema;
    this.stateCategory = stateCategory;
    this.deviceId = deviceId;
    this.initialize = initialize;
    this.getter = getter;
    this.setter = setter;
  }


  isWriting(): boolean {
    return this.writingQueuedCall.isExecuting();
  }

  isReading(): boolean {
    return Boolean(this.readingPromise);
  }

  getState(): StateObject {
    return this.system.state.getState(this.stateCategory, this.deviceId) || {};

    // if (this.tmpWritingOldState) return this.tmpWritingOldState;
    //
    // return this.system.state.getState(this.stateCategory, this.deviceId) || {};

    // const currentState = this.system.state.getState(this.stateCategory, this.deviceId) || {};
    //
    // if (this.tmpWritingPartialState) {
    //   return mergeDeep(this.tmpWritingPartialState, currentState);
    // }
    //
    // return currentState;
  }

  /**
   * Read whole state.
   * If getter is set it will call it and return state.
   * If there isn't setter - it will just return current state.
   * If writing is in progress it will return current state which is being writing at the moment
   * If reading is in progress it will wait for current reading request and will return its data
   */
  async readAll(): Promise<StateObject> {
    if (!this.getter || this.isWriting()) return this.getState();

    if (this.isReading()) {
      // wait for current reading. And throw an error if it throws
      this.readingPromise && await this.readingPromise.promise;

      return this.getState();
    }

    const result: StateObject = await this.requestGetter();

    // TODO: наверное сделать validate ???

    this.system.state.updateState(this.stateCategory, this.deviceId, result);

    return this.getState();
  }

  async readParam(paramName: string): Promise<JsonTypes> {
    // TODO: !!!!
    return;
  }

  /**
   * Update state and write it to setter.
   * If writing is in progress then a new writing will be queued.
   * If reading is in progress it will be cancelled and a new writing will be processed.
   */
  async write(partialData: StateObject): Promise<void> {
    if (isEmpty(partialData)) return;

    const oldState = this.getState();

    this.system.state.updateState(this.stateCategory, this.deviceId, partialData);

    // in mode without setter - just update state and rise an event
    if (!this.setter) return;

    // // make old state which was before writing
    // if (this.tmpWritingOldState) {
    //   this.tmpWritingOldState = mergeDeep(partialData, this.tmpWritingOldState);
    // }
    // else {
    //   this.tmpWritingOldState = partialData;
    //   //this.tmpWritingOldState = mergeDeep(partialData, this.system.state.getState(this.stateCategory, this.deviceId));
    // }

    this.tmpWritingOldState = oldState;
    
    if (this.isReading()) {
      // TODO: ??? отменить запрос текущего чтения и резолвить текущий getState
      //       проблема в том что мы можем читать другой параметр а записывать другой
      //       наверное тогда лучше запись сделать после чтения
    }

    this.validateDict(partialData,
      `Invalid device state to write: ${this.stateCategory}, ${this.deviceId}: "${JSON.stringify(partialData)}"`);

    await this.requestSetter();
  }


  private async requestGetter(): Promise<StateObject> {
    if (!this.getter) throw new Error(`No getter: ${this.deviceId}`);

    this.readingPromise = new Promised<void>();
    let result: StateObject;

    // make a request
    try {
      result = await this.getter();
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
  private async requestSetter(): Promise<void> {

    // TODO: надо записывать смерженный стейт с предыдущими попытками после 1й

    const callPromise = this.writingQueuedCall.callIt(async () => {
      if (!this.tmpWritingPartialState) throw new Error(`There isn't "tmpWritingPartialState"`);

      return this.setter && this.setter(partialData);
    });

    this.writingQueuedCall.callOnceOnSuccess(() => {
      delete this.tmpWritingOldState;
    });

    this.writingQueuedCall.callOnceOnError((err: Error) => {
      // TODO: print error ????

      if (!this.tmpWritingOldState) return;

      this.system.state.updateState(this.stateCategory, this.deviceId, this.tmpWritingOldState);

      delete this.tmpWritingOldState;
    });

    await callPromise;

    // TODO: проверить сработает ли
    // if there is a queue - update old tmp state
    if (this.writingQueuedCall.isExecuting()) {
      this.tmpWritingOldState = this.getState();
    }

    // try {
    //   await callPromise;
    //
    //   // TODO: проверить сработает ли
    //   // if there is a queue - update old tmp state
    //   if (this.writingQueuedCall.isExecuting()) {
    //     this.tmpWritingOldState = this.getState();
    //   }
    //
    //   this.writingQueuedCall.wholePromise && await this.writingQueuedCall.wholePromise;
    // }
    // catch (err) {
    //   // TODO: должно произойти 1 раз
    //   if (!this.tmpWritingOldState) throw err;
    //
    //   this.system.state.updateState(this.stateCategory, this.deviceId, this.tmpWritingOldState);
    //
    //   delete this.tmpWritingOldState;
    //
    //   throw err;
    // }
    //
    // // on success - just remove old state
    // delete this.tmpWritingOldState;
  }

  private validateDict(dict: {[index: string]: any}, errorMsg: string) {
    let validateError: string | undefined;

    for (let paramName of Object.keys(dict)) {
      validateError = validateParam(this.schema, paramName, dict[paramName]);

      if (validateError) break;
    }

    if (validateError) {
      const completeErrMsg = `${errorMsg}: ${validateError}`;

      throw new Error(completeErrMsg);
    }
  }

}
