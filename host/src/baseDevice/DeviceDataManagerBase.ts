import System from '../app/System';
import Republish from '../helpers/Republish';
import {validateParam, validateDict} from '../helpers/validateSchema';
import PublishParams from '../app/interfaces/PublishParams';
import IndexedEvents from '../helpers/IndexedEvents';
import {cloneDeep} from '../helpers/lodashLike';


export type Publisher = (subtopic: string, value: any, params?: PublishParams) => void;
export type PublishState = (changedParams: string[], isRepeat: boolean) => void;
export type Initialize = () => Promise<Data>;
export type Getter = (paramNames?: string[]) => Promise<Data>;
export type Setter = (partialData: Data) => Promise<void>;
export type Schema = {[index: string]: any};
export type Data = {[index: string]: any};
export type ChangeHandler = (changedParams: string[]) => void;


/**
 * Manage status of device
 * Events:
 * * change - it emits only if parameter is changed
 * * publish - it emits on changes and on republish
 */
export default abstract class DeviceDataManagerBase {
  protected readonly changeEvents = new IndexedEvents<ChangeHandler>();
  protected readonly publishEvents = new IndexedEvents<Publisher>();
  protected abstract readonly typeNameOfData: string;
  protected readonly deviceId: string;
  protected readonly system: System;
  protected readonly schema: Schema;
  protected readonly republish: Republish;
  protected initialize?: Initialize;
  protected getter?: Getter;
  protected setter?: Setter;

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

  async init(initialize?: Initialize, getter?: Getter, setter?: Setter): Promise<void> {
    this.initialize = initialize;
    this.getter = getter;
    this.setter = setter;

    // get first value after all the devices and drivers have been initialized
    this.system.onAppInit(async () => {
      await this.initFirstValue();
    });
  }

  getLocal(): Data {
    return this.localData;
  }

  onChange(cb: ChangeHandler): number {
    return this.changeEvents.addListener(cb);
  }

  onPublish(cb: Publisher): number {
    return this.publishEvents.addListener(cb);
  }

  removeListener(handlerIndex: number): void {
    this.changeEvents.removeListener(handlerIndex);
  }

  removePublishListener(handlerIndex: number): void {
    this.publishEvents.removeListener(handlerIndex);
  }


  protected async readAllData(): Promise<Data> {
    // if there isn't a data getter - just return local config
    if (!this.getter) return this.localData;

    // else fetch data if getter is defined

    const result: Data = await this.justReadAllData();

    // set to local data
    const updatedParams = this.setLocalData(result);
    //  rise events change event and publish
    this.emitOnChange(updatedParams);

    return this.localData;
  }

  /**
   * Get certain param value from device.
   */
  protected async readJustParam(statusName: string): Promise<any> {
    // if there isn't a data getter - just return local status
    if (!this.getter) return this.localData[statusName];
    // else fetch status if getter is defined

    const result: Data = await this.load(
      () => this.getter && this.getter([statusName]),
      `Can't fetch "${this.typeNameOfData}" "${statusName}" of device "${this.deviceId}"`
    );

    this.validateParam(statusName, result[statusName], `Invalid "${this.typeNameOfData}" "${statusName}" of device "${this.deviceId}"`);

    // set to local data and rise events
    const wasSet = this.setLocalDataParam(statusName, result[statusName]);

    if (wasSet) {
      //  rise events change event and publish
      this.emitOnChange([statusName]);
    }

    return this.localData[statusName];
  }

  protected async writeData(partialData: Data): Promise<void> {
    this.validateDict(partialData,
      `Invalid ${this.typeNameOfData} "${JSON.stringify(partialData)}" which tried to set to device "${this.deviceId}"`);

    // if there isn't a data setter - just set to local status
    if (!this.setter) {
      // set to local data
      const updatedParams = this.setLocalData(partialData);
      //  rise events change event and publish
      this.emitOnChange(updatedParams);

      return;
    }
    // else do request to device if getter is defined

    // TODO: при повторном запуске - только обновлять данные для отправки
    // TODO: что будет со значение которое было установленно в промежутке пока идет запрос и оно отличалось от старого???

    // TODO: поидее только те поля которые сохраняются
    // TODO: можно ли обойтись без cloneDeep?
    const oldData = cloneDeep(this.localData);
    // set to local data
    const updatedParams = this.setLocalData(partialData);
    //  rise events change event and publish
    this.emitOnChange(updatedParams);

    try {
      await this.save(
        () => this.setter && this.setter(partialData),
        `Can't save ${this.typeNameOfData} "${JSON.stringify(partialData)}" of device "${this.deviceId}"`
      );
    }
    catch (err) {
      // on error return to previous state
      // set to local data
      this.setLocalData(oldData);
      //  rise events change event and publish
      this.emitOnChange(updatedParams);
    }

  }

  protected validateParam(statusName: string, value: any, errorMsg: string) {

    // TODO: review

    const validateError: string | undefined = validateParam(this.schema, statusName, value);

    if (validateError) {
      const completeErrMsg = `${errorMsg}: ${validateError}`;

      this.system.log.error(completeErrMsg);
      throw new Error(completeErrMsg);
    }
  }

  protected validateDict(dict: {[index: string]: any}, errorMsg: string) {

    // TODO: review

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


  private async justReadAllData(): Promise<Data> {
    // if there isn't a data getter - just return local config
    if (!this.getter) return this.localData;
    // else fetch config if getter is defined

    const result: Data = await this.load(
      this.getter,
      `Can't fetch ${this.typeNameOfData} of device "${this.deviceId}"`
    );

    this.validateDict(result, `Invalid fetched ${this.typeNameOfData} "${JSON.stringify(result)}" of device "${this.deviceId}"`);

    return result;
  }

  private async initFirstValue() {
    let result: Data;

    if (this.initialize) {
      result = await this.load(
        this.initialize,
        `Can't fetch initial ${this.typeNameOfData} of device "${this.deviceId}" via initialize`
      );
    }
    else if (this.getter) {
      result = await this.load(
        this.getter,
        `Can't fetch initial ${this.typeNameOfData} of device "${this.deviceId}" via getter`
      );
    }
    else {
      result = this.getDefaultValues();
    }

    this.validateDict(result, `Invalid fetched initial ${this.typeNameOfData} "${JSON.stringify(result)}" of device "${this.deviceId}"`);
    // set to local data
    const updatedParams = this.setLocalData(result);
    //  rise events change event and publish
    this.emitOnChange(updatedParams);
  }

  /**
   * Set default values to local data
   */
  private getDefaultValues(): Data {
    const result: Data = {};

    for (let name of Object.keys(this.schema)) {
      if (typeof this.schema[name].default !== 'undefined') {
        result[name] = this.schema[name].default;
      }
    }

    return result;
  }

  /**
   * Set whole structure to local data.
   * If structure was set it returns true else false.
   * @returns {string} List of params names which was updated
   */
  private setLocalData(partialData: Data): string[] {
    const updatedParams: string[] = [];

    for (let name of Object.keys(partialData)) {
      if (partialData[name] !== this.localData[name]) updatedParams.push(name);
    }

    // do nothing if there isn't changed data
    if (!updatedParams.length) return updatedParams;

    // update local data
    this.localData = {
      ...this.localData,
      ...partialData,
    };

    return updatedParams;
  }

  /**
   * Set param to local data.
   * If param was set it returns true else false
   */
  private setLocalDataParam(paramName: string, value: any): boolean {
    if (this.localData[paramName] === value) return false;

    this.localData[paramName] = value;

    return true;
  }

  private emitOnChange(updatedParams: string[]) {
    if (updatedParams.length) {
      // emit change event
      this.changeEvents.emit(updatedParams);
      this.republish.start(this.republishCb);
    }

    // emit publish event
    this.publishState(updatedParams, false);
  }

  /**
   * Republish current state
   */
  private republishCb = async () => {
    const result: Data = await this.justReadAllData();

    // set to local data
    const updatedParams = this.setLocalData(result);

    // rise events change event
    if (updatedParams.length) {
      // emit change event
      this.changeEvents.emit(updatedParams);
    }

    this.publishState(Object.keys(this.getLocal()), true);
  }

}
