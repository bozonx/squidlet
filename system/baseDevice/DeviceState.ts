import {JsonTypes} from '../interfaces/Types';
import Promised from '../helpers/Promised';
import System from '../System';
import {StateObject} from '../State';


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
  private tmpOldState?: StateObject;
  private readingPromise?: Promised<void>;


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
    // TODO: add!!!
  }

  isReading(): boolean {
    return Boolean(this.readingPromise);
  }

  getState(): StateObject {
    const currentState: StateObject | undefined = this.system.state.getState(this.stateCategory, this.deviceId);

    if (!currentState) return {};

    return currentState;
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
      try {
        this.readingPromise && await this.readingPromise.promise;
      }
      catch (e) {
        return this.getState();
      }

      return this.getState();
    }

    const result: DeviceStateData = await this.requestGetter();

    // TODO:  нужно ли очищать tmpState ???

    this.state.updateState(DEVICE_STATE_CATEGORY, this.deviceId, result);

    return this.getState();
  }

  readParam(paramName: string): Promise<JsonTypes> {

  }

  write(partialData: DeviceStateData): Promise<void> {

  }


  private async requestGetter(): Promise<DeviceStateData> {
    if (!this.getter) throw new Error(`No getter: ${this.deviceId}`);

    this.readingPromise = new Promised<void>();
    let result: DeviceStateData;

    // make a request
    try {
      result = await this.getter();
    }
    catch (err) {
      //if (typeof promiseReject !== 'undefined') promiseReject(err);
      this.readingPromise.reject(err);

      delete this.readingPromise;

      throw new Error(`Can't fetch device state "${this.deviceId}": ${err}`);
    }

    this.readingPromise.resolve();

    delete this.readingPromise;

    return result;
  }

}
