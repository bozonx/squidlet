import System from '../app/System';
import {Publisher} from './DeviceBase';
import DeviceDataManagerBase, {Data, Schema} from './DeviceDataManagerBase';
import {combineTopic} from '../helpers/helpers';


// if statusNames is undefined - it means get all the statuses
export type Getter = (statusNames?: string[]) => Promise<Data>;
export type Setter = (newValue: any, statusName: string) => Promise<void>;
type ChangeHandler = (statusName?: string) => void;


/**
 * Manage status of device
 */
export default class Status extends DeviceDataManagerBase {
  private readonly getter?: Getter;
  private readonly setter?: Setter;

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

  async init(): Promise<void> {
    await this.read();
  }

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
      for (let statusName in Object.keys(this.localData)) {
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
  write = async (newValue: any, statusName: string = 'default'): Promise<void> => {
    this.validateParam(statusName, newValue,
      `Invalid status params "${statusName}" which tried to set to device "${this.deviceId}"`);

    // if there isn't a data setter - just set to local status
    if (!this.setter) {
      this.setLocalDataParam(statusName, newValue);

      return;
    }
    // else do request to device if getter is defined


    await this.save(
      () => this.setter && this.setter(newValue, statusName),
      `Can't save status "${statusName}: ${newValue}" of device "${this.deviceId}"`
    );

    // TODO: что будет со значение которое было установленно в промежутке пока идет запрос и оно отличалось от старого???

    const wasSet = this.setLocalDataParam(statusName, newValue);

    if (wasSet) {
      this.publishStatus(statusName, this.localData[statusName]);
    }
  }

  private publishStatus(statusName: string, value: any): Promise<void> {
    // TODO: нужно ли устанавливать параметры publish?
    if (statusName === 'default') {
      return this.publish('status', value);
    }

    const subStatus = combineTopic('status', statusName);

    return this.publish(subStatus, value);
  }

}
