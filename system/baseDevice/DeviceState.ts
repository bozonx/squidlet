import {JsonTypes} from '../interfaces/Types';


type DeviceStateData = {[index: string]: JsonTypes};
export type Initialize = () => Promise<DeviceStateData>;
export type Getter = (paramNames?: string[]) => Promise<DeviceStateData>;
export type Setter = (partialData: DeviceStateData) => Promise<void>;


export default class DeviceState {
  protected readonly deviceId: string;
  protected initialize?: Initialize;
  protected getter?: Getter;
  protected setter?: Setter;
  private tmpOldState?: DeviceStateData;
  private readingPromise?: Promise<void>;


  constructor(initialize?: Initialize, getter?: Getter, setter?: Setter) {
    this.initialize = initialize;
    this.getter = getter;
    this.setter = setter;
  }


  isWriting(): boolean {

  }

  isReading(): boolean {
    return Boolean(this.readingPromise);
  }

  getState(): DeviceStateData {
    // TODO: просто отдать стейт
  }

  /**
   * Read whole state.
   * If getter is set it will call it and return state.
   * If there isn't setter - it will just return current state.
   * If writing is in progress it will return current state which is being writing at the moment
   * If reading is in progress it will wait for current reading request and will return its data
   */
  async readAll(): Promise<DeviceStateData> {
    if (!this.getter || this.isWriting()) return this.getState();

    if (this.isReading()) {
      try {
        await this.readingPromise;
      }
      catch (e) {
        return this.getState();
      }

      return this.getState();
    }

    const result: DeviceStateData = await this.requestGetter();

    // TODO:  нужно ли очищать tmpState ???

    this.state.updateState(this.stateCategory, this.deviceId, result);

    return this.getState();
  }

  readParam(paramName: string): Promise<JsonTypes> {

  }

  write(partialData: DeviceStateData): Promise<void> {

  }


  private async requestGetter(): Promise<DeviceStateData> {
    if (!this.getter) throw new Error(`No getter: ${this.deviceId}`);

    let promiseResolve: () => void;
    let promiseReject: () => void;
    this.readingPromise = new Promise<void>((resolve, reject) => {
      promiseResolve = resolve;
      promiseReject = reject;
    });
    let result: DeviceStateData;

    // make a request
    try {
      result = await this.getter();
    }
    catch (err) {
      if (typeof promiseReject !== 'undefined') promiseReject(err);

      delete this.readingPromise;

      throw new Error(`Can't fetch device state "${this.deviceId}": ${err}`);
    }

    if (typeof promiseResolve !== 'undefined') promiseResolve();

    delete this.readingPromise;

    return result;
  }

}
