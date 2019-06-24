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
      this.system.log.error,
      schema,
      this.stateCategory,
      this.deviceId,
      this.stateGetter,
      this.stateUpdater,
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
  read = (): Promise<StateObject> => {
    return this.deviceState.readAll();
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


  private stateGetter = (): StateObject => {
    return this.system.state.getState(this.stateCategory, this.deviceId) || {};
  }

  private stateUpdater = (partialState: StateObject): void => {
    this.system.state.updateState(this.stateCategory, this.deviceId, partialState);
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
