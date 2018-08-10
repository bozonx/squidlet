import System from '../app/System';
import {Publisher} from './DeviceBase';
import DeviceDataManagerBase, {Data, Getter, Schema, Setter} from './DeviceDataManagerBase';


// TODO: наверное массив измененных параметров
type ChangeHandler = () => void;
export type Setter = Setter;
export type Getter = Getter;


/**
 * Manage config of device
 */
export default class Config extends DeviceDataManagerBase {
  protected readonly getter?: Getter;
  protected readonly setter?: Setter;

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
  write = async (partialData: Data): Promise<void> => {
    return this.writeData('status', partialData, () => {
      // TODO: нужно ли устанавливать параметры publish?
      this.publish('config', this.localData);
    });
  }

}
