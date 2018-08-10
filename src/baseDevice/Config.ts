import System from '../app/System';
import {Publisher} from './DeviceBase';
import DeviceDataManagerBase, {Data, Schema} from './DeviceDataManagerBase';


// get whole config
export type Getter = () => Promise<Data>;
export type Setter = (partialConfig: Data) => Promise<void>;
type ChangeHandler = (config: Data) => void;


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

  onChange(cb: ChangeHandler): void {
    super.onChange(cb);
  }

  removeListener(cb: ChangeHandler) {
    super.removeListener(cb);
  }

  /**
   * Get whole config from device.
   */
  read = async (): Promise<Data> => {
    const getter = async () => this.getter && await this.getter() || {};

    return this.readAllData('config', getter, () => {
      // TODO: нужно ли устанавливать параметры publish?
      this.publish('config', this.localData);
    });
  }

  /**
   * Set config to device
   */
  write = async (partialConfig: Data): Promise<void> => {
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

    await this.save(
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
