import DeviceDataManagerBase, {Data} from './DeviceDataManagerBase';
import PublishParams from '../app/interfaces/PublishParams';


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
      this.publishData(undefined, false);
    });
  }

  /**
   * Set config to device
   */
  write = async (partialData: Data): Promise<void> => {
    return this.writeData('status', partialData, () => {
      this.publishData(undefined, false);
    });
  }

  /**
   * Publish whole config on each change
   */
  protected publishData(changedParams: undefined, isRepeat: boolean) {
    const params: PublishParams = {
      isRepeat,
    };

    // publish all the statuses
    this.publish('config', this.localData, params);
  }

}
