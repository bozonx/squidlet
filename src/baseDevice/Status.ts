import DeviceDataManagerBase, {Data} from './DeviceDataManagerBase';
import {combineTopic} from '../helpers/helpers';


// TODO: remake to ParamGetter
// if statusNames is undefined - it means get all the statuses
type ChangeHandler = (statusName?: string) => void;

export const DEFAULT_STATUS = 'default';


/**
 * Manage status of device
 */
export default class Status extends DeviceDataManagerBase {
  onChange(cb: ChangeHandler): void {
    super.onChange(cb);
  }

  removeListener(cb: ChangeHandler) {
    super.removeListener(cb);
  }

  /**
   * Get all the statuses
   */
  read = async (): Promise<Data> => {
    const getter = async () => this.getter && await this.getter() || {};

    return this.readAllData('status', getter, () => {
      // publish all the statuses
      for (let statusName of Object.keys(this.localData)) {
        this.publishStatus(statusName, this.localData[statusName]);
      }
    });
  }

  /**
   * Get status from device.
   */
  readParam = async (statusName: string = 'default'): Promise<any> => {
    // if there isn't a data getter - just return local status
    if (!this.getter) return this.localData[statusName];
    // else fetch status if getter is defined


    const result: {[index: string]: any} = await this.load(
      () => this.getter && this.getter([statusName]),
      `Can't fetch status "${statusName}" of device "${this.deviceId}"`
    );

    this.validateParam(statusName, result[statusName], `Invalid status "${statusName}" of device "${this.deviceId}"`);

    const wasSet = this.setLocalDataParam(statusName, result[statusName]);

    if (wasSet) {
      this.publishStatus(statusName, this.localData[statusName]);
    }

    return this.localData[statusName];
  }

  /**
   * Set status of device.
   */
  write = async (partialData: Data): Promise<void> => {
    return this.writeData('status', partialData, () => {
      for (let statusName of Object.keys(this.localData)) {
        this.publishStatus(statusName, this.localData[statusName]);
      }
    });
  }

  private publishStatus(statusName: string, value: any): Promise<void> {
    // TODO: нужно ли устанавливать параметры publish?
    if (statusName === DEFAULT_STATUS) {
      return this.publish('status', value);
    }

    const subStatus = combineTopic('status', statusName);

    return this.publish(subStatus, value);
  }

}
