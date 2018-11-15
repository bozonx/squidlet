import * as EventEmitter from 'eventemitter3';

import System from '../app/System';
import Republish from './Republish';
import {validateParam, validateDict} from '../helpers/validateSchema';
import PublishParams from '../app/interfaces/PublishParams';


export type Publisher = (subtopic: string, value: any, params?: PublishParams) => void;
export type PublishState = (changedParams: string[], isRepeat: boolean) => void;
export type Getter = (paramNames?: string[]) => Promise<Data>;
export type Setter = (partialData: Data) => Promise<void>;
export type Schema = {[index: string]: any};
export type Data = {[index: string]: any};
export type ChangeHandler = (changedParams: string[], isRepeat: boolean) => void;

export const changeEventName = 'change';
export const publishEventName = 'publish';


/**
 * Manage status of device
 */
export default abstract class DeviceDataManagerBase {
  protected readonly deviceId: string;
  protected readonly system: System;
  protected readonly schema: Schema;
  protected readonly republish: Republish;
  protected getter?: Getter;
  protected setter?: Setter;
  protected readonly events: EventEmitter = new EventEmitter();

  protected abstract publishState: PublishState;
  abstract read: () => Promise<Data>;
  abstract write: (partialData: Data) => Promise<void>;

  protected localData: Data = {};


  constructor(deviceId: string, system: System, schema: Schema, republishInterval?: number) {
    this.deviceId = deviceId;
    this.system = system;
    this.schema = schema;

    const realRepublishInterval = (typeof republishInterval === 'undefined')
      ? this.system.host.config.config.defaultStatusRepublishIntervalMs
      : republishInterval;

    this.republish = new Republish(realRepublishInterval);
  }

  async init(getter?: Getter, setter?: Setter): Promise<void> {
    this.getter = getter;
    this.setter = setter;

    if (this.getter) {
      // initialize status
      await this.read();

      // TODO: если не получилось прочитать - установить значение по умолчанию
    }
    else {
      this.setDefaultValues();
    }
  }


  getLocal(): Data {
    return this.localData;
  }

  onChange(cb: ChangeHandler) {
    this.events.addListener(changeEventName, cb);
  }

  onPublish(cb: Publisher) {
    this.events.addListener(publishEventName, cb);
  }

  removeListener(cb: ChangeHandler) {
    this.events.removeListener(changeEventName, cb);
  }


  protected async readAllData(typeNameOfData: string, getter: () => Promise<Data>): Promise<Data> {
    // if there isn't a data getter - just return local config
    if (!getter) return this.localData;
    // else fetch config if getter is defined

    const result: Data = await this.load(
      getter,
      `Can't fetch ${typeNameOfData} of device "${this.deviceId}"`
    );

    this.validateDict(result, `Invalid fetched ${typeNameOfData} "${JSON.stringify(result)}" of device "${this.deviceId}"`);
    // set to local data and rise events
    this.setLocalData(result);

    return this.localData;
  }

  /**
   * Get certain param value from device.
   */
  protected async readJustParam(typeNameOfData: string, statusName: string, getter: () => Promise<Data>): Promise<any> {
    // if there isn't a data getter - just return local status
    if (!getter) return this.localData[statusName];
    // else fetch status if getter is defined

    const result: Data = await this.load(
      () => this.getter && this.getter([statusName]),
      `Can't fetch "${typeNameOfData}" "${statusName}" of device "${this.deviceId}"`
    );

    this.validateParam(statusName, result[statusName], `Invalid "${typeNameOfData}" "${statusName}" of device "${this.deviceId}"`);
    this.setLocalDataParam(statusName, result[statusName]);

    return this.localData[statusName];
  }

  protected async writeData(typeNameOfData: string, partialData: Data): Promise<void> {
    this.validateDict(partialData,
      `Invalid ${typeNameOfData} "${JSON.stringify(partialData)}" which tried to set to device "${this.deviceId}"`);

    // if there isn't a data setter - just set to local status
    if (!this.setter) {
      this.setLocalData(partialData);

      return;
    }
    // else do request to device if getter is defined

    await this.save(
      () => this.setter && this.setter(partialData),
      `Can't save ${typeNameOfData} "${JSON.stringify(partialData)}" of device "${this.deviceId}"`
    );

    // TODO: что будет со значение которое было установленно в промежутке пока идет запрос и оно отличалось от старого???

    this.setLocalData(partialData);
  }

  protected validateParam(statusName: string, value: any, errorMsg: string) {
    const validateError: string | undefined = validateParam(this.schema, statusName, value);

    if (validateError) {
      const completeErrMsg = `${errorMsg}: ${validateError}`;

      this.system.log.error(completeErrMsg);
      throw new Error(completeErrMsg);
    }
  }

  protected validateDict(dict: {[index: string]: any}, errorMsg: string) {
    const validateError: string | undefined = validateDict(this.schema, dict);

    if (validateError) {
      const completeErrMsg = `${errorMsg}: ${validateError}`;

      this.system.log.error(completeErrMsg);
      throw new Error(completeErrMsg);
    }
  }

  protected async load(fetcher: () => any, errorMsg: string): Promise<any> {
    let result;

    // TODO: встать в очередь(дождаться пока выполнится текущий запрос) и не давать перебить его запросом единичных статустов

    // TODO: если запрос статуса в процессе - то не делать новый запрос, а ждать пока пройдет текущий запрос
      // установить в очередь следующий запрос и все новые запросы будут получать результат того что в очереди

    try {
      result = await fetcher();
    }
    catch(err) {
      this.system.log.error(`${errorMsg}: ${err.toString()}`);
      throw new Error(err);
    }

    return result;
  }

  protected async save(fetcher: () => void, errorMsg: string): Promise<any> {
    let result;

    // TODO: если запрос установки статуса в процессе - то дождаться завершения и сделать новый запрос,
      // при этом в очереди может быть только 1 запрос - самый последний

    try {
      result = await fetcher();
    }
    catch(err) {
      this.system.log.error(`${errorMsg}: ${err.toString()}`);
      throw new Error(err);
    }

    return result;
  }

  /**
   * Set param to local data.
   * If param was set it returns true else false
   */
  protected setLocalDataParam(paramName: string, value: any): boolean {
    if (this.localData[paramName] === value) return false;

    this.localData[paramName] = value;
    this.events.emit(changeEventName, [paramName], false);

    this.publishState([paramName], false);

    this.republish.start(this.republishCb);

    return true;
  }

  /**
   * Set whole structure to local data.
   * If structure was set it returns true else false.
   * @returns {string} List of params names which was updated
   */
  protected setLocalData(partialData: Data): string[] {
    const updatedParams: string[] = [];

    for (let name of Object.keys(partialData)) {
      if (partialData[name] !== this.localData[name]) updatedParams.push(name);
    }

    if (!updatedParams.length) return updatedParams;

    this.localData = {
      ...this.localData,
      ...partialData,
    };

    this.events.emit(changeEventName, updatedParams, false);

    if (updatedParams.length) {
      this.publishState(updatedParams, false);
    }

    this.republish.start(this.republishCb);

    return updatedParams;
  }

  /**
   * Set default values to local data
   */
  protected setDefaultValues() {
    for (let name of Object.keys(this.schema)) {
      // TODO: наверное поддерживать короткую запись значения по умаолчанию
      if (
        typeof this.schema[name] === 'object'
        && this.schema[name].type
        && typeof this.schema[name].default !== 'undefined'
      ) {
        this.localData[name] = this.schema[name].default;
      }
    }
  }


  /**
   * Republish current state
   */
  private republishCb = () => {

    // TODO: считать стейт заново

    this.publishState(Object.keys(this.getLocal()), true);
  }

}
