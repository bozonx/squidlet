import * as _ from 'lodash';
import * as EventEmitter from 'events';

import System from '../app/System';
import Republish from './Republish';
import {Publisher} from './DeviceBase';
import {combineTopic} from '../helpers/helpers';
import {validateParam} from '../helpers/validateSchema';


type Schema = {[index: string]: any};
// if statusNames is undefined - it means get all the statuses
export type StatusGetter = (statusNames?: string[]) => Promise<{[index: string]: any}>;
export type StatusSetter = (newValue: any, statusName: string) => Promise<void>;
type ChangeHandler = (statusName?: string) => void;

const ChangeEventName = 'change';


/**
 * Manage local status
 */
export default class Status {
  private readonly deviceId: string;
  private readonly system: System;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly schema: Schema;
  private readonly republish: Republish;
  // TODO: нужно ли указывать тип?
  private localCache: {[index: string]: any} = {};
  private readonly publish: Publisher;
  private readonly statusGetter?: StatusGetter;
  private readonly statusSetter?: StatusSetter;

  constructor(
    deviceId: string,
    system: System,
    schema: Schema,
    publish: Publisher,
    republishInterval?: number,
    statusGetter?: StatusGetter,
    statusSetter?: StatusSetter
  ) {
    this.deviceId = deviceId;
    this.system = system;
    this.schema = schema;
    this.publish = publish;
    this.statusGetter = statusGetter;
    this.statusSetter = statusSetter;

    const realRepublishInterval = (typeof republishInterval === 'undefined')
      ? this.system.host.config.devices.defaultStatusRepublishIntervalMs
      : republishInterval;

    this.republish = new Republish(realRepublishInterval);
  }

  async init(): Promise<void> {
    await this.getStatuses();
  }

  /**
   * Get all the statuses
   */
  getStatuses = async (): Promise<{[index: string]: any}> => {
    // TODO: встать в очередь(дождаться пока выполнится текущий запрос) и не давать перебить его запросом единичных статустов

    const oldCache = this.localCache;

    // update local cache if statusGetter is defined
    if (this.statusGetter) {
      // TODO: validate result
      // TODO: писать в лог при ошибке
      this.localCache = await this.statusGetter();

      if (!_.isEqual(oldCache, this.localCache)) {
        // publish all the statuses
        for (let statusName in Object.keys(this.localCache)) {
          this.publishStatus(statusName, this.localCache[statusName]);
        }
        this.events.emit(ChangeEventName);
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

    // update local cache if statusGetter is defined
    if (this.statusGetter) {
      let result: {[index: string]: any};

      try {
        result = await this.statusGetter([statusName]);
      }
      catch(err) {
        this.system.log.error(`Can't fetch status "${statusName}" of device "${this.deviceId}": ${err.toString()}`);
        throw new Error(err);
      }

      const validateError: string | undefined = validateParam(this.schema, statusName, result[statusName]);

      if (validateError) {
        const errMsg = `Invalid status "${statusName}" of device "${this.deviceId}": ${validateError}`;

        this.system.log.error(errMsg);
        throw new Error(errMsg);
      }

      this.localCache = {
        ...this.localCache,
        ...result,
      };

      if (!_.isEqual(oldValue, this.localCache[statusName])) {
        this.publishStatus(statusName, this.localCache[statusName]);
        this.events.emit(ChangeEventName, statusName);
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
    // TODO: check types via schema
    // TODO: validate new value

    // TODO: если запрос установки статуса в процессе - то дождаться завершения и сделать новый запрос,
        // при этом в очереди может быть только 1 запрос - самый последний

    // TODO: писать в лог при ошибке

    if (this.statusSetter) {
      await this.statusSetter(newValue, statusName);
    }

    // TODO: что будет со значение которое было установленно в промежутке пока идет запрос и оно отличалось от старого???

    this.localCache[statusName] = newValue;

    if (!_.isEqual(oldValue, newValue)) {
      // TODO: call republish
      this.publishStatus(statusName, this.localCache[statusName]);
      this.events.emit(ChangeEventName, statusName);
    }
  }

  onChange(cb: ChangeHandler) {
    this.events.addListener(ChangeEventName, cb);
  }

  removeListener(cb: ChangeHandler) {
    this.events.removeListener(ChangeEventName, cb);
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
