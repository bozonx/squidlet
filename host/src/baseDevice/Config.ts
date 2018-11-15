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
      this.publishState(Object.keys(this.localData), false);
    });
  }

  /**
   * Set config to device
   */
  write = async (partialData: Data): Promise<void> => {
    return this.writeData('status', partialData, () => {
      this.publishState(Object.keys(this.localData), false);
    });
  }

  /**
   * Publish whole config on each change
   */
  protected publishState = (changedParams: string[], isRepeat: boolean) => {
    const params: PublishParams = {
      isRepeat,
    };

    // publish all the statuses
    this.publish('config', this.localData, params);
  }

}
