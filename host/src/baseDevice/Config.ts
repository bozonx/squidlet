import DeviceDataManagerBase, {Data, publishEventName} from './DeviceDataManagerBase';
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

    return this.readAllData('config', getter);
  }

  /**
   * Set config to device
   */
  write = async (partialData: Data): Promise<void> => {
    return this.writeData('status', partialData);
  }

  /**
   * Publish whole config on each change
   */
  protected publishState = (changedParams: string[], isRepeat: boolean) => {
    const params: PublishParams = {
      isRepeat,
    };

    // publish all the statuses
    this.events.emit(publishEventName, 'config', this.localData, params);
  }

}
