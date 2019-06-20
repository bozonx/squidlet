import DeviceDataManagerBase, {Data} from './DeviceDataManagerBase';


/**
 * Manage config of device
 */
export default class Config extends DeviceDataManagerBase {
  protected readonly typeNameOfData: string = 'config';

  // TODO: add getState
  // TODO: add isWriting

  /**
   * Get whole config from device.
   */
  read = async (): Promise<Data> => {
    return this.readAllData();
  }

  /**
   * Set config to device
   */
  write = async (partialData: Data): Promise<void> => {
    return this.writeData(partialData);
  }

  /**
   * Publish whole config on each change
   */
  protected publishState = (changedParams: string[], isRepeat: boolean) => {
    // publish all the statuses
    this.publishEvents.emit(this.typeNameOfData, this.getState(), isRepeat);
  }

}
