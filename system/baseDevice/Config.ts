import System from '../System';
import DeviceState, {Schema} from './DeviceState';
import {Getter, Initialize, Setter} from './ConsistentState';
import {StateCategories} from '../interfaces/States';
import {StateObject} from '../State';


export type ConfigChangeHandler = () => void;


/**
 * Manage config of device
 */
export default class Config {
  private readonly system: System;
  private readonly deviceId: string;
  private readonly deviceState: DeviceState;
  private stateCategory = StateCategories.devicesConfig;


  constructor(
    system: System,
    schema: Schema,
    deviceId: string,
    initialize?: Initialize,
    getter?: Getter,
    setter?: Setter
  ) {
    this.system = system;
    this.deviceId = deviceId;

    this.deviceState = new DeviceState(
      schema,
      this.stateGetter,
      this.stateUpdater,
      this.system.log.error,
      initialize,
      getter,
      setter,
    );
  }

  async init() {
    await this.deviceState.init();
  }

  destroy() {
    this.deviceState.destroy();
  }


  isReading(): boolean {
    return this.deviceState.isReading();
  }

  isWriting(): boolean {
    return this.deviceState.isWriting();
  }

  /**
   * Get whole config from device.
   */
  read = async (): Promise<StateObject> => {
    try {
      return await this.deviceState.readAll();
    }
    catch (err) {
      throw new Error(`Status.read device "${this.deviceId}": ${err}`);
    }
  }

  /**
   * Set config to device
   */
  write = async (partialData: StateObject): Promise<void> => {
    try {
      await this.deviceState.write(partialData);
    }
    catch (err) {
      throw new Error(`Status.write device "${this.deviceId}": ${err}`);
    }
  }

  onChange(cb: ConfigChangeHandler): number {
    // TODO: use it system.state - но отфильтровывать только нужные данные

    this.system.state.onChange();
  }


  private stateGetter = (): StateObject => {
    return this.system.state.getState(this.stateCategory, this.deviceId) || {};
  }

  private stateUpdater = (partialState: StateObject): void => {
    this.system.state.updateState(this.stateCategory, this.deviceId, partialState);
  }

}


// /**
//  * Publish whole config on each change
//  */
// protected publishState = (changedParams: string[], isRepeat: boolean) => {
//   // publish all the statuses
//   this.publishEvents.emit(this.typeNameOfData, this.getState(), isRepeat);
// }
