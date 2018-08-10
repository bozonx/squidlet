const _isEqual = require('lodash/_isEqual');

import System from '../app/System';
import {Publisher} from './DeviceBase';
import DeviceDataManagerBase, {changeEventName, Schema} from './DeviceDataManagerBase';
import {combineTopic} from '../helpers/helpers';


// if statusNames is undefined - it means get all the statuses
export type Getter = (statusNames?: string[]) => Promise<{[index: string]: any}>;
export type Setter = (newValue: any, statusName: string) => Promise<void>;
type ChangeHandler = (statusName?: string) => void;


/**
 * Manage status of device
 */
export default class Status extends DeviceDataManagerBase {
  // TODO: нужно ли указывать тип?
  private localCache: {[index: string]: any} = {};
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
    await this.getStatuses();
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
  getStatuses = async (): Promise<{[index: string]: any}> => {
    // TODO: встать в очередь(дождаться пока выполнится текущий запрос) и не давать перебить его запросом единичных статустов

    const oldCache = this.localCache;

    // update local cache if getter is defined
    if (this.getter) {
      const result: {[index: string]: any} = await this.fetch(
        this.getter,
        `Can't fetch statuses of device "${this.deviceId}"`
      );

      // TODO: лучш валидировать всю схему целиком
      for (let statusName in Object.keys(this.localCache)) {
        this.validateStatus(statusName, result[statusName], `Invalid status "${statusName}" of device "${this.deviceId}"`);
      }

      this.localCache = result;

      if (!_isEqual(oldCache, this.localCache)) {
        // publish all the statuses
        for (let statusName in Object.keys(this.localCache)) {
          this.publishStatus(statusName, this.localCache[statusName]);
        }
        this.events.emit(changeEventName);
        // TODO: call republish
      }
    }

    return this.localCache;
  }

  /**
   * Get status from device.
   */
  getStatus = async (statusName: string = 'default'): Promise<any> => {
    // TODO: если запрос статуса в процессе - то не делать новый запрос, а ждать пока пройдет текущий запрос
      // установить в очередь следующий запрос и все новые запросы будут получать результат того что в очереди

    const oldValue = this.localCache[statusName];

    // update local cache if getter is defined
    if (this.getter) {
      const result: {[index: string]: any} = await this.fetch(
        () => this.getter && this.getter([statusName]),
        `Can't fetch status "${statusName}" of device "${this.deviceId}"`
      );

      this.validateStatus(statusName, result[statusName], `Invalid status "${statusName}" of device "${this.deviceId}"`);

      this.localCache = {
        ...this.localCache,
        ...result,
      };

      if (!_isEqual(oldValue, this.localCache[statusName])) {
        this.publishStatus(statusName, this.localCache[statusName]);
        this.events.emit(changeEventName, statusName);
        // TODO: call republish
      }
    }

    return this.localCache[statusName];
  }

  /**
   * Set status of device.
   */
  setStatus = async (newValue: any, statusName: string = 'default'): Promise<void> => {
    const oldValue = this.localCache[statusName];
    this.validateStatus(statusName, newValue, `Invalid status params "${statusName}" which tried to set to device "${this.deviceId}"`);

    // TODO: если запрос установки статуса в процессе - то дождаться завершения и сделать новый запрос,
        // при этом в очереди может быть только 1 запрос - самый последний

    if (this.setter) {
      await this.fetch(
        () => this.setter && this.setter(newValue, statusName),
        `Can't save status "${statusName}: ${newValue}" of device "${this.deviceId}"`
      );
    }

    // TODO: что будет со значение которое было установленно в промежутке пока идет запрос и оно отличалось от старого???

    this.localCache[statusName] = newValue;

    if (!_isEqual(oldValue, newValue)) {
      // TODO: call republish
      this.publishStatus(statusName, this.localCache[statusName]);
      this.events.emit(changeEventName, statusName);
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
