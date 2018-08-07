import * as _ from 'lodash';
import * as EventEmitter from 'events';
import Republish from './Republish';
import {Publisher} from './DeviceBase';


export type StatusGetter = (statusName: string) => Promise<any>;
export type StatusSetter = (newValue: any, statusName: string) => Promise<void>;
type ChangeHandler = (newValue: any, statusName: string) => void;

const ChangeEventName = 'change';


/**
 * Manage local status
 */
export default class Status {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly republish: Republish;
  // TODO: нужно ли указывать тип?
  private readonly localCache: {[index: string]: any} = {};
  private readonly publish?: Publisher;
  private readonly statusGetter?: StatusGetter;
  private readonly statusSetter?: StatusSetter;

  constructor(
    republishInterval: number,
    publish: Publisher,
    statusGetter?: StatusGetter,
    statusSetter?: StatusSetter
  ) {
    this.publish = publish;
    this.statusGetter = statusGetter;
    this.statusSetter = statusSetter;
    this.republish = new Republish(republishInterval);
  }

  init(): Promise<void> {
    // TODO: initialize - get values
  }

  /**
   * Get status from device.
   */
  getStatus = async (statusName: string = 'default'): Promise<any> => {
    // TODO: если запрос статуса в процессе - то не делать новый запрос, а ждать пока пройдет текущий запрос
      // установить в очередь следующий запрос и все новые запросы будут получать результат того что в очереди

    // TODO: писать в лог при ошибке

    const oldValue = this.localCache[statusName];

    // update local cache if statusGetter is defined
    if (this.statusGetter) {
      this.localCache[statusName] = await this.statusGetter(statusName);

      if (!_.isEqual(oldValue, this.localCache[statusName])) {
        // TODO: call republish
        this.events.emit(ChangeEventName, this.localCache[statusName], statusName);
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
      this.events.emit(ChangeEventName, newValue, statusName);
    }
  }

  onChange(cb: ChangeHandler) {
    this.events.addListener(ChangeEventName, cb);
  }

  removeListener(cb: ChangeHandler) {
    this.events.removeListener(ChangeEventName, cb);
  }

}
