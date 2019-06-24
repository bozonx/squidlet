import System from '../System';
import {Getter, Initialize, Setter} from './ConsistentState';
import DeviceState, {Schema} from './DeviceState';
import {StateCategories} from '../interfaces/States';
import {StateObject} from '../State';
import {JsonTypes} from '../interfaces/Types';


export const DEFAULT_STATUS = 'default';

export type StatusChangeHandler = (changedParams: string[]) => void;


/**
 * Manage status of device
 */
export default class Status {
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
      this.system,
      schema,
      this.stateCategory,
      this.deviceId,
      initialize,
      getter,
      setter
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
  read = (): Promise<StateObject> => {
    return this.deviceState.readAll();
  }

  /**
   * Get status from device.
   */
  readParam = (statusName: string = DEFAULT_STATUS): Promise<JsonTypes> => {
    return this.deviceState.readParam(statusName);
  }

  /**
   * Set status of device.
   */
  write = async (partialData: StateObject): Promise<void> => {
    await this.deviceState.write(partialData);
  }

  onChange(cb: StatusChangeHandler): number {
    // TODO: use it system.state - но отфильтровывать только нужные данные
    // TODO: use it system.state - может использовать onChangeStateParam ???

    const wrapper = (category: number, stateName: string, changedParams: string[]): void => {
      // TODO: check state name correctly (contents status) !!!!

      if (category !== this.stateCategory || stateName !== this.deviceId) return;

      cb(changedParams);
    };

    return this.system.state.onChange(wrapper);
  }

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
