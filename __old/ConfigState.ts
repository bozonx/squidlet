import System from '../system/System';
import DeviceState, {Schema} from '../system/baseDevice/DeviceState';
import {Getter, Initialize, Setter} from '../system/baseDevice/ConsistentState';
import {StateCategories} from '../system/interfaces/States';
import {StateObject} from '../system/State';


export type ConfigChangeHandler = () => void;


/**
 * Manage config of device
 */
export default class ConfigState {
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

  getState(): StateObject {
    return this.deviceState.getState();
  }

  setIncomeState(partialState: StateObject) {
    this.deviceState.setIncomeState(partialState);
  }

  /**
   * Get whole config from device.
   */
  /**
   * Force load state from getter.
   */
  load = async (): Promise<void> => {
    return this.deviceState.load();
  }

  /**
   * Set config to device
   */
  write = async (partialData: StateObject): Promise<void> => {
    await this.deviceState.write(partialData);
  }

  // onChange(cb: ConfigChangeHandler): number {
  //   const wrapper = (category: number, stateName: string): void => {
  //     if (category !== this.stateCategory || stateName !== this.deviceId) return;
  //
  //     cb();
  //   };
  //
  //   return this.system.state.onChange(wrapper);
  // }


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
