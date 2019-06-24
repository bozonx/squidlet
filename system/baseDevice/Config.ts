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
      StateCategories.devicesConfig,
      deviceId,
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

  // TODO: add getState

  /**
   * Get whole config from device.
   */
  read = async (): Promise<Data> => {
    return this.readAllData();
  }

  /**
   * Set config to device
   */
  write = async (partialData: StateObject): Promise<void> => {
    await this.deviceState.write(partialData);
  }

  onChange(cb: ConfigChangeHandler): number {
    // TODO: use it system.state - но отфильтровывать только нужные данные

    this.system.state.onChange();
  }


  // TODO: review !!!!!

  /**
   * Publish whole config on each change
   */
  protected publishState = (changedParams: string[], isRepeat: boolean) => {
    // publish all the statuses
    this.publishEvents.emit(this.typeNameOfData, this.getState(), isRepeat);
  }

}
