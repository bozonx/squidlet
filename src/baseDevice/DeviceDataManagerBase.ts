const _isEqual = require('lodash/_isEqual');
import * as EventEmitter from 'events';

import System from '../app/System';
import Republish from './Republish';
import {Publisher} from './DeviceBase';
import {validateParam, validateDict} from '../helpers/validateSchema';


export type Getter = (itemNames?: string[]) => Promise<Data>;
export type Setter = (partialData: Data) => Promise<void>;
export type Schema = {[index: string]: any};
export type Data = {[index: string]: any};

export const changeEventName = 'change';


/**
 * Manage status of device
 */
export default abstract class DeviceDataManagerBase {
  protected readonly deviceId: string;
  protected readonly system: System;
  protected readonly events: EventEmitter = new EventEmitter();
  protected readonly publish: Publisher;
  protected readonly schema: Schema;
  protected readonly republish: Republish;
  protected readonly getter?: Getter;
  protected readonly setter?: Setter;

  protected localData: Data = {};

  constructor(
    deviceId: string,
    system: System,
    schema: Schema,
    publish: Publisher,
    republishInterval?: number,
    getter?: Getter,
    setter?: Setter
  ) {
    this.deviceId = deviceId;
    this.system = system;
    this.schema = schema;
    this.publish = publish;
    this.getter = getter;
    this.setter = setter;

    const realRepublishInterval = (typeof republishInterval === 'undefined')
      ? this.system.host.config.devices.defaultStatusRepublishIntervalMs
      : republishInterval;

    this.republish = new Republish(realRepublishInterval);
  }

  abstract read: () => Promise<Data>;
  abstract write: (partialData: Data) => Promise<void>;

  async init(): Promise<void> {
    if (this.getter) {
      await this.read();
    }
    else {
      this.setDefaultValues();
    }
  }

  onChange(cb: (...params: any[]) => void) {
    this.events.addListener(changeEventName, cb);
  }

  removeListener(cb: (...params: any[]) => void) {
    this.events.removeListener(changeEventName, cb);
  }


  protected async readAllData(typeNameOfData: string, getter: () => Promise<Data>, onUpdate: () => void): Promise<Data> {
    // if there isn't a data getter - just return local config
    if (!getter) return this.localData;
    // else fetch config if getter is defined

    const result: Data = await this.load(
      getter,
      `Can't fetch ${typeNameOfData} of device "${this.deviceId}"`
    );

    this.validateDict(result, `Invalid fetched ${typeNameOfData} "${JSON.stringify(result)}" of device "${this.deviceId}"`);

    const wasSet = this.setLocalData(result);

    if (wasSet) {
      onUpdate();
    }

    return this.localData;
  }

  protected async writeData(typeNameOfData: string, partialData: Data, onUpdate: () => void): Promise<void> {
    this.validateDict(partialData,
      `Invalid ${typeNameOfData} "${JSON.stringify(partialData)}" which tried to set to device "${this.deviceId}"`);

    const newData = {
      ...this.localData,
      ...partialData,
    };

    // if there isn't a data setter - just set to local status
    if (!this.setter) {
      this.setLocalData(newData);

      return;
    }
    // else do request to device if getter is defined

    await this.save(
      () => this.setter && this.setter(newData),
      `Can't save ${typeNameOfData} "${JSON.stringify(newData)}" of device "${this.deviceId}"`
    );

    // TODO: что будет со значение которое было установленно в промежутке пока идет запрос и оно отличалось от старого???

    const wasSet = this.setLocalData(newData);

    if (wasSet) {
      onUpdate();
    }
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

  protected async load(fetcher: () => void, errorMsg: string): Promise<any> {
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
    this.events.emit(changeEventName, paramName);
    // TODO: call republish

    return true;
  }

  /**
   * Set whole structure to local data.
   * If structure was set it returns true else false.
   */
  protected setLocalData(newLocalData: Data): boolean {
    if (_isEqual(this.localData, newLocalData)) return false;

    this.localData = newLocalData;
    this.events.emit(changeEventName);
    // TODO: call republish

    return true;
  }

  /**
   * Set default values to local data
   */
  setDefaultValues() {
    for (let name of Object.keys(this.schema)) {
      // TODO: наверное поддерживать короткую запись значения по умаолчанию
      if (typeof this.schema[name] === 'object' && this.schema[name].type && this.schema[name].default) {
        this.localData[name] = this.schema[name].default;
      }
    }
  }

}
