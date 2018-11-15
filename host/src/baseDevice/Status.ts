import DeviceDataManagerBase, {Data, publishEventName} from './DeviceDataManagerBase';
import {combineTopic} from '../helpers/helpers';
import PublishParams from '../app/interfaces/PublishParams';


export const DEFAULT_STATUS = 'default';


/**
 * Manage status of device
 */
export default class Status extends DeviceDataManagerBase {
  /**
   * Get all the statuses
   */
  read = async (): Promise<Data> => {
    const getter = async () => this.getter && await this.getter() || {};

    return this.readAllData('status', getter, (changedParams: string[]) => {
      // publish all the statuses
      this.publishState(changedParams, false);
    });
  }

  /**
   * Get status from device.
   */
  readParam = async (statusName: string = DEFAULT_STATUS): Promise<any> => {

    // TODO: move to base class

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
      // TODO: review
      this.publishOneStatus(statusName, this.localData[statusName], false);
    }

    return this.localData[statusName];
  }

  /**
   * Set status of device.
   */
  write = async (partialData: Data): Promise<void> => {
    return this.writeData('status', partialData, (changedParams: string[]) => {
      this.publishState(changedParams, false);
    });
  }


  /**
   * Publish all the statuses by separate message.
   */
  protected publishState = (changedParams: string[], isRepeat: boolean) => {
    // publish all the statuses
    for (let statusName of changedParams) {
      this.publishOneStatus(statusName, this.localData[statusName], isRepeat);
    }
  }

  private publishOneStatus(statusName: string, value: any, isRepeat: boolean) {
    const params: PublishParams = {
      isRepeat,
    };

    if (statusName === DEFAULT_STATUS) {
      this.events.emit(publishEventName, 'status', value, params);

      return;
    }

    const subStatus = combineTopic('status', statusName);

    this.events.emit(publishEventName, subStatus, value, params);
  }

}
