import {combineTopic} from '../helpers/helpers';
import System from '../System';
import {Getter, Initialize, Setter} from './ConsistentState';
import DeviceState, {Schema} from './DeviceState';
import {StateCategories} from '../interfaces/States';
import {StateObject} from '../State';


export const DEFAULT_STATUS = 'default';

export type StatusChangeHandler = (changedParams: string[]) => void;


/**
 * Manage status of device
 */
export default class Status {
  private readonly system: System;
  private readonly deviceState: DeviceState;


  constructor(
    system: System,
    schema: Schema,
    deviceId: string,
    initialize?: Initialize,
    getter?: Getter,
    setter?: Setter
  ) {
    this.system = system;

    this.deviceState = new DeviceState(
      this.system,
      schema,
      StateCategories.devicesStatus,
      deviceId,
      initialize,
      getter,
      setter
    );
  }

  async init() {
    await this.deviceState.init();
  }


  isReading(): boolean {
    return this.deviceState.isReading();
  }

  isWriting(): boolean {
    return this.deviceState.isWriting();
  }

  // TODO: add getState

  /**
   * Get all the statuses
   */
  read = async (): Promise<Data> => {
    return this.readAllData();
  }

  /**
   * Get status from device.
   */
  readParam = async (statusName: string = DEFAULT_STATUS): Promise<any> => {
    return this.readJustParam(statusName);
  }

  /**
   * Set status of device.
   */
  write = async (partialData: StateObject): Promise<void> => {
    await this.deviceState.write(partialData);
  }

  onChange(cb: StatusChangeHandler): number {
    // TODO: use it system.state - но отфильтровывать только нужные данные

    this.system.state.onChange();
  }


  // TODO: review !!!!!

  /**
   * Publish all the statuses by separate message.
   */
  protected publishState = (changedParams: string[], isRepeat: boolean) => {
    // publish all the statuses
    for (let statusName of changedParams) {
      this.publishOneStatus(this.getState()[statusName], statusName, isRepeat);
    }
  }

  private publishOneStatus(value: any, statusName: string, isRepeat: boolean) {
    if (statusName === DEFAULT_STATUS) {
      this.publishEvents.emit(this.typeNameOfData, value, isRepeat);

      return;
    }

    const subStatus = combineTopic(this.system.systemConfig.topicSeparator, this.typeNameOfData, statusName);

    this.publishEvents.emit(subStatus, value, isRepeat);
  }


  // TODO: why publish and not set state ????
  publish(value: string | number | boolean, statusName: string = DEFAULT_STATUS) {
    this.publishOneStatus(value, statusName, false);
  }

}
