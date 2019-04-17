import DeviceDataManagerBase, {Data} from './DeviceDataManagerBase';
import {combineTopic} from '../helpers/helpers';
import PublishParams from '../interfaces/PublishParams';


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
    return this.readAllData();
  }

  /**
   * Get status from device.
   */
  readParam = async (statusName: string = DEFAULT_STATUS): Promise<any> => {
    return this.readJustParam(statusName);
  }

  /**
   * Set status of device.
   */
  write = async (partialData: Data, silent?: boolean) => {
    await this.writeData(partialData, silent);
  }

  publish(value: string | number | boolean, statusName: string = DEFAULT_STATUS) {
    this.publishOneStatus(value, statusName, false);
  }


  /**
   * Publish all the statuses by separate message.
   */
  protected publishState = (changedParams: string[], isRepeat: boolean) => {
    // publish all the statuses
    for (let statusName of changedParams) {
      this.publishOneStatus(this.getState()[statusName], statusName, isRepeat);
    }
  }


  private publishOneStatus(value: any, statusName: string, isRepeat: boolean) {
    const params: PublishParams = {
      isRepeat,
    };

    if (statusName === DEFAULT_STATUS) {
      this.publishEvents.emit(this.typeNameOfData, value, params);

      return;
    }

    const subStatus = combineTopic(this.system.systemConfig.topicSeparator, this.typeNameOfData, statusName);

    this.publishEvents.emit(subStatus, value, params);
  }

}
