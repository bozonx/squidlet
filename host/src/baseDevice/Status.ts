import DeviceDataManagerBase, {Data, publishEventName} from './DeviceDataManagerBase';
import {combineTopic} from '../helpers/helpers';
import PublishParams from '../app/interfaces/PublishParams';


export const DEFAULT_STATUS = 'default';


/**
 * Manage status of device
 */
export default class Status extends DeviceDataManagerBase {
  protected readonly typeNameOfData: string = 'status';

  /**
   * Get all the statuses
   */
  read = async (): Promise<Data> => {
    const getter = async () => this.getter && await this.getter() || {};

    return this.readAllData(getter);
  }

  /**
   * Get status from device.
   */
  readParam = async (statusName: string = DEFAULT_STATUS): Promise<any> => {
    const getter = async () => this.getter && await this.getter() || {};

    return this.readJustParam(statusName, getter);
  }

  /**
   * Set status of device.
   */
  write = async (partialData: Data): Promise<void> => {
    return this.writeData(partialData);
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
      this.events.emit(publishEventName, this.typeNameOfData, value, params);

      return;
    }

    const subStatus = combineTopic(this.typeNameOfData, statusName);

    this.events.emit(publishEventName, subStatus, value, params);
  }

}
