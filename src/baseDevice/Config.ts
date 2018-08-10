import DeviceDataManagerBase, {Data} from './DeviceDataManagerBase';


/**
 * Manage config of device
 */
export default class Config extends DeviceDataManagerBase {
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
