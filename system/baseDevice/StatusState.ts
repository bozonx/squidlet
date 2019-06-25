import System from '../System';
import {Getter, Initialize, Setter} from './ConsistentState';
import DeviceState, {Schema} from './DeviceState';
import {StateCategories} from '../interfaces/States';
import {StateObject} from '../State';
import {JsonTypes} from '../interfaces/Types';
import {combineTopic} from '../helpers/helpers';


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

  /**
   * Get all the statuses
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
   * Get status from device.
   */
  readParam = async (statusName: string = DEFAULT_STATUS): Promise<JsonTypes> => {
    try {
      return await this.deviceState.readParam(statusName);
    }
    catch (err) {
      throw new Error(`Status.readParam device "${this.deviceId}": ${err}`);
    }
  }

  /**
   * Set status of device.
   */
  write = async (partialData: StateObject): Promise<void> => {
    try {
      await this.deviceState.write(partialData);
    }
    catch (err) {
      throw new Error(`Status.write device "${this.deviceId}": ${err}`);
    }
  }

  onChangeParam(cb: StatusChangeHandler): number {
    const wrapper = (category: number, stateName: string, paramName: string, value: JsonTypes): void => {
      if (category !== this.stateCategory || stateName !== this.deviceId) return;

      cb(paramName, value);
    };

    return this.system.state.onChangeParam(wrapper);
  }


  private stateGetter = (): StateObject => {
    return this.system.state.getState(this.stateCategory, this.deviceId) || {};
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
