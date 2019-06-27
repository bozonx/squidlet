import System from '../system/System';
import {Getter, Initialize, Setter} from '../system/baseDevice/ConsistentState';
import DeviceState, {Schema} from '../system/baseDevice/DeviceState';
import {StateCategories} from '../system/interfaces/States';
import {StateObject} from '../system/State';
import {JsonTypes} from '../system/interfaces/Types';


export const DEFAULT_STATUS = 'default';

export type StatusChangeHandler = (paramName: string, value: JsonTypes) => void;


/**
 * Manage status of device
 */
export default class StatusState {
  private readonly system: System;
  private readonly deviceId: string;
  private readonly deviceState: DeviceState;
  private stateCategory = StateCategories.devicesStatus;


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
   * Force load state from getter.
   */
  load = async (): Promise<void> => {
    return this.deviceState.load();
  }

  // /**
  //  * Get status from device.
  //  */
  // readParam = async (statusName: string = DEFAULT_STATUS): Promise<JsonTypes> => {
  //   try {
  //     return await this.deviceState.readParam(statusName);
  //   }
  //   catch (err) {
  //     throw new Error(`Status.readParam device "${this.deviceId}": ${err}`);
  //   }
  // }

  /**
   * Set status of device.
   */
  write = async (partialData: StateObject): Promise<void> => {
    await this.deviceState.write(partialData);
  }

  // onChangeParam(cb: StatusChangeHandler): number {
  //   const wrapper = (category: number, stateName: string, paramName: string, value: JsonTypes): void => {
  //     if (category !== this.stateCategory || stateName !== this.deviceId) return;
  //
  //     cb(paramName, value);
  //   };
  //
  //   return this.system.state.onChangeParam(wrapper);
  // }


  private stateGetter = (): StateObject => {
    // TODO: use system
    return this.getState();
  }

  private stateUpdater = (partialState: StateObject): void => {
    this.system.state.updateState(this.stateCategory, this.deviceId, partialState);
  }

  // private makeStateName(): string {
  //   return combineTopic(STATE_SEPARATOR, this.deviceId, paramName: string);
  // }

}

// /**
//  * Publish all the statuses by separate message.
//  */
// protected publishState = (changedParams: string[], isRepeat: boolean) => {
//   // publish all the statuses
//   for (let statusName of changedParams) {
//     this.publishOneStatus(this.getState()[statusName], statusName, isRepeat);
//   }
// }
//
// private publishOneStatus(value: any, statusName: string, isRepeat: boolean) {
//   if (statusName === DEFAULT_STATUS) {
//     this.publishEvents.emit(this.typeNameOfData, value, isRepeat);
//
//     return;
//   }
//
//   const subStatus = combineTopic(this.system.systemConfig.topicSeparator, this.typeNameOfData, statusName);
//
//   this.publishEvents.emit(subStatus, value, isRepeat);
// }
//
//
// // T-O-D-O: why publish and not set state ????
// publish(value: string | number | boolean, statusName: string = DEFAULT_STATUS) {
//   this.publishOneStatus(value, statusName, false);
// }