import System from '../System';
import IndexedEvents from '../helpers/IndexedEvents';
import {isEmpty} from '../helpers/lodashLike';
import {getDifferentKeys} from '../helpers/collections';
import {validateParam} from '../helpers/validate';


export type Publisher = (subtopic: string, value: any, isRepeat?: boolean) => void;
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
  // protected readonly changeEvents = new IndexedEvents<ChangeHandler>();
  // protected readonly publishEvents = new IndexedEvents<Publisher>();
  protected abstract readonly typeNameOfData: string;
  protected readonly deviceId: string;
  protected readonly system: System;
  protected readonly schema: Schema;
  // TODO: review
  protected initialize?: Initialize;
  protected getter?: Getter;
  protected setter?: Setter;

  //protected abstract publishState: PublishState;
  abstract read: () => Promise<Data>;
  abstract write: (partialData: Data) => Promise<void>;

  // state which in consistency with remote state
  protected localState: Data = {};
  // temporary state which contents the newest state while saving of request is in progress
  protected tmpState?: Data;


  //, republishInterval?: number
  constructor(deviceId: string, system: System, schema: Schema) {
    this.deviceId = deviceId;
    this.system = system;
    this.schema = schema;

    // const realRepublishInterval = (typeof republishInterval === 'undefined')
    //   ? this.system.config.config.defaultStatusRepublishIntervalMs
    //   : republishInterval;
    //
    // this.republish = new Republish(realRepublishInterval);
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

  /**
   * Get local state. It returns temporary state if it set else local state.
   */
  getState(): Data {
    // TODO: review
    if (this.tmpState) return this.tmpState;

    return this.localState;
  }


  /**
   * Returns full dataset.
   * If getter is set: read data using "getter"
   * It there isn't a getter - return "localData"
   */
  protected async readAllData(): Promise<Data> {
    // if there isn't a data getter - just return local state
    // or if there is a writing request in progress
    // then disallow making read request and return data which will be saved
    if (!this.getter || this.isWriting()) return this.getState();

    // else fetch data if getter is defined

    const result: Data = await this.justReadAllData();
    const updatedParams: string[] = getDifferentKeys(this.localState, result);

    // TODO: use State ???
    this.localState = {
      ...this.localState,
      ...result,
    };
    // clear temporary state because we have the last one
    this.tmpState = undefined;
    //  rise events change event and publish
    this.emitOnChange(updatedParams);

    return this.getState();
  }

  /**
   * Get certain param value from device.
   * If getter is set: read data using "getter"
   * It there isn't a getter - return "localData"
   */
  protected async readJustParam(paramName: string): Promise<any> {
    // if there isn't a data getter - just return local status
    // or if fetch status if getter is defined
    // if there is a writing request in progress
    // then disallow making read request and return data which will be saved
    if (!this.getter || this.isWriting()) return this.getState()[paramName];

    const result: Data = await this.doRequest(
      () => this.getter && this.getter([paramName]),
      `Can't fetch "${this.typeNameOfData}" "${paramName}" of device "${this.deviceId}"`
    );

    this.validateParam(paramName, result[paramName], `Invalid "${this.typeNameOfData}" "${paramName}" of device "${this.deviceId}"`);

    // set to local data and rise events
    if (this.localState[paramName] !== result[paramName]) {
      this.localState[paramName] = result[paramName];
      // update last consistent param value if there is a temporary state
      if (this.tmpState) (this.tmpState as any)[paramName] = result[paramName];

      //  rise events change event and publish
      this.emitOnChange([paramName]);
    }

    return this.getState()[paramName];
  }

  /**
   * Write full dataset.
   * If getter is set: it writes data using "setter" and update "localData"
   * It there isn't a getter - it sets to "localData"
   */
  protected async writeData(partialData: Data, silent?: boolean): Promise<void> {
    if (isEmpty(partialData)) return;

    this.validateDict(partialData,
      `Invalid ${this.typeNameOfData} "${JSON.stringify(partialData)}" which tried to set to device "${this.deviceId}"`);

    // if there isn't a data setter - just set to local status
    if (!this.setter) {
      // set to local data
      const updatedParams = getDifferentKeys(this.localState, partialData);

      this.localState = {
        ...this.localState,
        ...partialData,
      };

      //  rise events change event and publish
      this.emitOnChange(updatedParams, silent);

      return;
    }
    // else do request

    return this.writeAllDataAndSetState(partialData, silent);
  }


  isWriting(): boolean {
    return Boolean(this.tmpState);
  }

  /**
   * Gets initial value:
   * * if "initialize" callback is set - it tries call it and set data which is received
   * * else if "getter" callback is set - it tries call it and set data which is received
   * * else get default values from schema
   */
  private async initFirstValue() {
    let result: Data = await this.fetchFirstValue();

    this.validateDict(result, `Invalid fetched initial ${this.typeNameOfData} "${JSON.stringify(result)}" of device "${this.deviceId}"`);
    // set to local data
    this.localState = {
      ...this.localState,
      ...result,
    };
    // rise change events and publish on all the params
    this.emitOnChange(Object.keys(this.localState));
  }

  private async fetchFirstValue(): Promise<Data> {
    if (this.getter) {
      return this.doRequest(
        this.getter,
        `Can't fetch initial ${this.typeNameOfData} of device "${this.deviceId}" via getter`
      );
    }
    else if (this.initialize) {
      return this.doRequest(
        this.initialize,
        `Can't fetch initial ${this.typeNameOfData} of device "${this.deviceId}" via initialize`
      );
    }

    return this.getDefaultValues();
  }

  private async justReadAllData(): Promise<Data> {
    // if there isn't a data getter - just return local config
    if (!this.getter) return this.getState();
    // else fetch config if getter is defined

    const result: Data = await this.doRequest(
      this.getter,
      `Can't fetch ${this.typeNameOfData} of device "${this.deviceId}"`
    );

    this.validateDict(result, `Invalid fetched ${this.typeNameOfData} "${JSON.stringify(result)}" of device "${this.deviceId}"`);

    return result;
  }

  private async writeAllDataAndSetState(partialData: Data, silent?: boolean): Promise<void> {
    const updatedParams = getDifferentKeys(this.localState, partialData);

    // set tmpState - it is the newest state.
    if (!this.tmpState) {
      //this.tmpState = cloneDeep(this.localState);
      this.tmpState = {
        ...this.localState,
        ...partialData,
      };
    }

    //  rise events change event and publish
    this.emitOnChange(updatedParams, silent);

    try {
      await this.doRequest(
        () => this.setter && this.setter(partialData),
        `Can't save ${this.typeNameOfData} "${JSON.stringify(partialData)}" of device "${this.deviceId}"`
      );
    }
    catch (err) {
      // clear tmpState

      if (this.tmpState) {
        this.tmpState = undefined;
        //  rise events change event and publish
        this.emitOnChange(updatedParams, silent);
      }

      throw err;
    }

    // on success - set tmpState as a permanent one
    if (this.tmpState) {
      this.localState = this.tmpState;
      this.tmpState = undefined;
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
    let validateError: string | undefined;

    for (let paramName of Object.keys(dict)) {
      validateError = validateParam(this.schema, paramName, dict[paramName]);

      if (validateError) break;
    }

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


  // onChange(cb: ChangeHandler): number {
  //   return this.changeEvents.addListener(cb);
  // }
  //
  // onPublish(cb: Publisher): number {
  //   return this.publishEvents.addListener(cb);
  // }

  // /**
  //  * Remove listener which was set by 'onChange'
  //  */
  // removeListener(handlerIndex: number): void {
  //   this.changeEvents.removeListener(handlerIndex);
  // }
  //
  // /**
  //  * Remove listener which was set by 'onPublish'
  //  */
  // removePublishListener(handlerIndex: number): void {
  //   this.publishEvents.removeListener(handlerIndex);
  // }

  // private emitOnChange(updatedParams: string[], silent?: boolean) {
  //   if (!updatedParams.length) return;
  //
  //   // emit change event
  //   this.changeEvents.emit(updatedParams);
  //   // start/restart republish logic
  //   this.republish.start(this.republishCb);
  //   // emit publish event
  //   if (!silent) this.publishState(updatedParams, false);
  // }

  // /**
  //  * Republish current state.
  //  * It reads current data and set it to localState.
  //  * And do publish.
  //  */
  // private republishCb = async () => {
  //   // read current data
  //   const result: Data = await this.justReadAllData();
  //
  //   // set to local data
  //   const updatedParams = getDifferentKeys(this.localState, result);
  //
  //   this.localState = {
  //     ...this.localState,
  //     ...result,
  //   };
  //   // clear temporary state because we have the last one
  //   this.tmpState = undefined;
  //
  //   // rise events change event
  //   if (updatedParams.length) {
  //     // emit change event
  //     this.changeEvents.emit(updatedParams);
  //   }
  //
  //   // publish state any way even values hasn't changed
  //   this.publishState(Object.keys(this.getState()), true);
  // }

}


// /**
//  * Set whole structure to local data.
//  * It clears tmp state and set consistent new state.
//  * @returns {string} List of params names which were updated
//  */
// private setLocalState(partialData: Data): string[] {
//
//   // TODO: remove
//
//   const updatedParams: string[] = [];
//
//   for (let name of Object.keys(partialData)) {
//     if (partialData[name] !== this.localState[name]) updatedParams.push(name);
//   }
//
//   // do nothing if there isn't changed data
//   if (!updatedParams.length) return updatedParams;
//
//   // update local data
//   this.localState = {
//     ...this.localState,
//     ...partialData,
//   };
//
//   return updatedParams;
// }

// /**
//  * Set param to local data.
//  * If param was set it returns true else false
//  */
// private setLocalStateParam(paramName: string, value: any): boolean {
//
//   // TODO: revew
//
//   if (this.localState[paramName] === value) return false;
//
//   this.localState[paramName] = value;
//
//   return true;
// }
