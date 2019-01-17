import System from '../app/System';
import Republish from '../helpers/Republish';
import {validateParam, validateDict} from '../helpers/validateSchema';
import PublishParams from '../app/interfaces/PublishParams';
import IndexedEvents from '../helpers/IndexedEvents';
import {cloneDeep, isEmpty, isEqual} from '../helpers/lodashLike';


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

  /**
   * Remove listener which was set by 'onChange'
   */
  removeListener(handlerIndex: number): void {
    this.changeEvents.removeListener(handlerIndex);
  }

  /**
   * Remove listener which was set by 'onPublish'
   */
  removePublishListener(handlerIndex: number): void {
    this.publishEvents.removeListener(handlerIndex);
  }


  /**
   * Returns full dataset.
   * If getter is set: read data using "getter"
   * It there isn't a getter - return "localData"
   */
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
   * If getter is set: read data using "getter"
   * It there isn't a getter - return "localData"
   */
  protected async readJustParam(paramName: string): Promise<any> {
    // if there isn't a data getter - just return local status
    if (!this.getter) return this.localData[paramName];
    // else fetch status if getter is defined

    const result: Data = await this.doRequest(
      () => this.getter && this.getter([paramName]),
      `Can't fetch "${this.typeNameOfData}" "${paramName}" of device "${this.deviceId}"`
    );

    this.validateParam(paramName, result[paramName], `Invalid "${this.typeNameOfData}" "${paramName}" of device "${this.deviceId}"`);

    // set to local data and rise events
    const wasSet = this.setLocalDataParam(paramName, result[paramName]);

    if (wasSet) {
      //  rise events change event and publish
      this.emitOnChange([paramName]);
    }

    return this.localData[paramName];
  }

  /**
   * Write full dataset.
   * If getter is set: it writes data using "setter" and update "localData"
   * It there isn't a getter - it sets to "localData"
   */
  protected async writeData(partialData: Data): Promise<void> {
    if (isEmpty(partialData)) return;

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
    // else do request

    return this.writeAllDataAndSetState(partialData);
  }


  /**
   * Gets initial value:
   * * if "initialize" callback is set - it tries call it and set data which is received
   * * else if "getter" callback is set - it tries call it and set data which is received
   * * else get default values from schema
   */
  private async initFirstValue() {
    let result: Data;

    if (this.initialize) {
      result = await this.doRequest(
        this.initialize,
        `Can't fetch initial ${this.typeNameOfData} of device "${this.deviceId}" via initialize`
      );
    }
    else if (this.getter) {
      result = await this.doRequest(
        this.getter,
        `Can't fetch initial ${this.typeNameOfData} of device "${this.deviceId}" via getter`
      );
    }
    else {
      result = this.getDefaultValues();
    }

    this.validateDict(result, `Invalid fetched initial ${this.typeNameOfData} "${JSON.stringify(result)}" of device "${this.deviceId}"`);
    // set to local data
    this.localData = {
      ...this.localData,
      result,
    };
    // rise change events and publish on all the params
    this.emitOnChange(Object.keys(this.localData));
  }

  private async justReadAllData(): Promise<Data> {
    // if there isn't a data getter - just return local config
    if (!this.getter) return this.localData;
    // else fetch config if getter is defined

    const result: Data = await this.doRequest(
      this.getter,
      `Can't fetch ${this.typeNameOfData} of device "${this.deviceId}"`
    );

    this.validateDict(result, `Invalid fetched ${this.typeNameOfData} "${JSON.stringify(result)}" of device "${this.deviceId}"`);

    return result;
  }

  private async writeAllDataAndSetState(partialData: Data): Promise<void> {
    const oldData: Data = {};

    for (let key of Object.keys(partialData)) oldData[key] = cloneDeep(partialData[key]);

    // set to local data
    const updatedParams = this.setLocalData(partialData);
    //  rise events change event and publish
    this.emitOnChange(updatedParams);

    try {
      await this.doRequest(
        () => this.setter && this.setter(partialData),
        `Can't save ${this.typeNameOfData} "${JSON.stringify(partialData)}" of device "${this.deviceId}"`
      );
    }
    catch (err) {

      // TODO: нужно гарантированно знать что это последний промис, а предыдущие catch не должны отрабатывать

      // on error return to previous state
      const currentData: Data = {};
      // collect current data
      for (let key of updatedParams) currentData[key] = this.localData[key];

      // do nothing if some param has been changed while request was in progress
      if (!isEqual(currentData, partialData)) return;

      // set old data to localData
      //for (let key of updatedParams) this.localData[key] = oldData[key];
      this.localData = {
        ...this.localData,
        ...oldData,
      };

      //  rise change event and publish
      this.emitOnChange(updatedParams);

      throw err;
    }
  }

  private validateParam(paramName: string, value: any, errorMsg: string) {
    const validateError: string | undefined = validateParam(this.schema, paramName, value);

    if (validateError) {
      const completeErrMsg = `${errorMsg}: ${validateError}`;

      throw new Error(completeErrMsg);
    }
  }

  private validateDict(dict: {[index: string]: any}, errorMsg: string) {
    const validateError: string | undefined = validateDict(this.schema, dict);

    if (validateError) {
      const completeErrMsg = `${errorMsg}: ${validateError}`;

      throw new Error(completeErrMsg);
    }
  }

  private async doRequest(fetcher: () => any, errorMsg: string): Promise<any> {
    let result;

    try {
      result = await fetcher();
    }
    catch(err) {
      this.system.log.error(`${errorMsg}: ${String(err)}`);
      throw err;
    }

    return result;
  }

  /**
   * Get default values from schema of local state
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
   * @returns {string} List of params names which were updated
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
    if (!updatedParams.length) return;

    // emit change event
    this.changeEvents.emit(updatedParams);
    // start/restart republish logic
    this.republish.start(this.republishCb);
    // emit publish event
    this.publishState(updatedParams, false);
  }

  /**
   * Republish current state.
   * It reads current data and set it to localState.
   * And do publish.
   */
  private republishCb = async () => {
    // read current data
    const result: Data = await this.justReadAllData();

    // set to local data
    const updatedParams = this.setLocalData(result);

    // rise events change event
    if (updatedParams.length) {
      // emit change event
      this.changeEvents.emit(updatedParams);
    }

    // publish state any way even values hasn't changed
    this.publishState(Object.keys(this.getLocal()), true);
  }

}
