import {JsonTypes} from '../interfaces/Types';
import Promised from '../helpers/Promised';
import System from '../System';
import {StateObject} from '../State';
import {isEmpty} from '../helpers/lodashLike';


export type Initialize = () => Promise<StateObject>;
export type Getter = (paramNames?: string[]) => Promise<StateObject>;
export type Setter = (partialData: StateObject) => Promise<void>;


export default class DeviceState {
  private readonly system: System;
  private readonly stateCategory: number;
  private readonly deviceId: string;
  private readonly initialize?: Initialize;
  private readonly getter?: Getter;
  private readonly setter?: Setter;
  private tmpWritingPartialState?: StateObject;
  private readingPromise?: Promised<void>;
  private writeQueued: boolean = false;
  //private queuedWriting?: () => void;


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


  isWriting(): boolean {
    return Boolean(this.tmpWritingPartialState);
  }

  isReading(): boolean {
    return Boolean(this.readingPromise);
  }

  getState(): StateObject {
    // TODO: смержить стейт
    if (this.tmpWritingPartialState) return this.tmpWritingPartialState;

    return this.system.state.getState(this.stateCategory, this.deviceId) || {};
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

  readParam(paramName: string): Promise<JsonTypes> {
    // TODO: !!!!
  }

  /**
   * Update state and write it to setter.
   * If writing is in progress then a new writing will be queued.
   * If reading is in progress ???
   */
  async write(partialData: StateObject): Promise<void> {
    if (isEmpty(partialData)) return;

    this.system.state.updateState(this.stateCategory, this.deviceId, partialData);

    if (!this.setter) return;

    if (this.isReading()) {
      // TODO: !!!! отменить текущее чтение и делать запись
    }

    this.tmpWritingPartialState = partialData;

    if (this.isWriting()) {
      this.writeQueued = true;

      return;
    }

    this.validateDict(partialData,
      `Invalid ${this.typeNameOfData} "${JSON.stringify(partialData)}" which tried to set to device "${this.deviceId}"`);

    // TODO: !!!! выполнить и очистить this.queuedWriting

    await this.requestSetter(partialData);
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

  private async requestSetter(partialData: StateObject): Promise<void> {
    // TODO: !!!!
  }

}
