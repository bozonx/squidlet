const _isEqual = require('lodash/_isEqual');

import System from '../app/System';
import {Publisher} from './DeviceBase';
import DeviceDataManagerBase, {changeEventName, Schema} from './DeviceDataManagerBase';


// TODO: нужно ли указывать тип?
type DeviceConfig = {[index: string]: any};
// get whole config
export type Getter = () => Promise<DeviceConfig>;
export type Setter = (partialConfig: DeviceConfig) => Promise<void>;
type ChangeHandler = (config: DeviceConfig) => void;


/**
 * Manage config of device
 */
export default class Config extends DeviceDataManagerBase {
  private readonly getter?: Getter;
  private readonly setter?: Setter;

  constructor(
    deviceId: string,
    system: System,
    schema: Schema,
    publish: Publisher,
    republishInterval?: number,
    getter?: Getter,
    setter?: Setter
  ) {
    super(deviceId, system, schema, publish, republishInterval);
    this.getter = getter;
    this.setter = setter;
  }

  async init(): Promise<void> {
    await this.getConfig();
  }

  onChange(cb: ChangeHandler): void {
    super.onChange(cb);
  }

  removeListener(cb: ChangeHandler) {
    super.removeListener(cb);
  }

  /**
   * Get whole config from device.
   */
  getConfig = async (): Promise<DeviceConfig> => {
    // if there isn't a data getter - just return local config
    if (!this.getter) return this.localData;
    // else fetch config if getter is defined

    // TODO: если запрос статуса в процессе - то не делать новый запрос, а ждать пока пройдет текущий запрос
       // установить в очередь следующий запрос и все новые запросы будут получать результат того что в очереди

    const result: {[index: string]: any} = await this.fetch(
      this.getter,
      `Can't fetch config of device "${this.deviceId}"`
    );

    this.validateDict(result, `Invalid fetched config "${JSON.stringify(result)}" of device "${this.deviceId}"`);

    const wasSet = this.setLocalData(result);

    if (wasSet) {
      // TODO: нужно ли устанавливать параметры publish?
      this.publish('config', this.localData);
    }

    return this.localData;
  }

  /**
   * Set config to device
   */
  setConfig = async (partialConfig: DeviceConfig): Promise<void> => {
    this.validateDict(partialConfig,
      `Invalid config "${JSON.stringify(partialConfig)}" which tried to set to device "${this.deviceId}"`);

    const newConfig = {
      ...this.localData,
      ...partialConfig,
    };

    // if there isn't a data setter - just set to local status
    if (!this.setter) {
      this.setLocalData(newConfig);

      return;
    }
    // else do request to device if getter is defined

    // TODO: если запрос установки статуса в процессе - то дождаться завершения и сделать новый запрос,
      // при этом в очереди может быть только 1 запрос - самый последний

    await this.fetch(
      () => this.setter && this.setter(newConfig),
      `Can't save config "${JSON.stringify(newConfig)}" of device "${this.deviceId}"`
    );

    // TODO: что будет со значение которое было установленно в промежутке пока идет запрос и оно отличалось от старого???

    const wasSet = this.setLocalData(newConfig);

    if (wasSet) {
      // TODO: нужно ли устанавливать параметры publish?
      this.publish('config', this.localData);
    }
  }

}
