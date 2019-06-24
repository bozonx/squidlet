import {StateObject} from '../State';
import {JsonTypes} from '../interfaces/Types';
import SchemaElement from '../interfaces/SchemaElement';
import {isEmpty} from '../helpers/lodashLike';
import {validateParam} from '../helpers/validate';
import ConsistentState, {Getter, Setter, Initialize} from './ConsistentState';
import {collectPropsDefaults} from '../helpers/helpers';


export type Schema = {[index: string]: SchemaElement};


export default class DeviceState {
  private readonly logError: (msg: string) => void;
  private readonly schema: Schema;
  private readonly stateGetter: () => StateObject;
  private readonly stateUpdater: (partialState: StateObject) => void;
  private readonly initialize?: Initialize;
  private readonly getter?: Getter;
  // private readonly setter?: Setter;
  private readonly consistentState: ConsistentState;


  constructor(
    schema: Schema,
    stateGetter: () => StateObject,
    stateUpdater: (partialState: StateObject) => void,
    logError: (msg: string) => void,
    initialize?: Initialize,
    getter?: Getter,
    setter?: Setter,
  ) {
    this.logError = logError;
    this.schema = schema;
    this.stateGetter = stateGetter;
    this.stateUpdater = stateUpdater;
    this.initialize = initialize;
    this.getter = getter;

    this.consistentState = new ConsistentState(
      this.logError,
      this.stateGetter,
      this.stateUpdater,
      this.initialize,
      this.getter,
      setter,
    );
  }

  async init() {
    if (!this.getter && !this.initialize) {
      const initState = collectPropsDefaults(this.schema);

      this.stateUpdater(initState);

      return;
    }

    await this.consistentState.init();

    this.validateDict(
      this.consistentState.getState(),
      `Invalid device state on init: "${JSON.stringify(this.consistentState.getState())}"`
    );
  }

  destroy() {
    this.consistentState.destroy();
  }


  isReading(): boolean {
    return this.consistentState.isReading();
  }

  isWriting(): boolean {
    return this.consistentState.isWriting();
  }

  // getState(): StateObject {
  //   return this.consistentState.getState();
  // }

  async readAll(): Promise<StateObject> {
    if (!this.getter || this.isWriting()) return this.consistentState.getState();

    await this.consistentState.loadAll();

    this.validateDict(
      this.consistentState.getState(),
      `Invalid device state readAll: "${JSON.stringify(this.consistentState.getState())}"`
    );

    return this.consistentState.getState();
  }

  async readParam(paramName: string): Promise<JsonTypes> {
    // TODO: !!!! может объединить с readAll только добавить список параметров ???
    return;
  }

  async write(partialData: StateObject): Promise<void> {
    if (isEmpty(partialData)) return;

    this.validateDict(
      partialData,
      `Invalid device state to write: "${JSON.stringify(partialData)}"`
    );

    return this.consistentState.write(partialData);
  }


  // TODO: писать в warn
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

  private validateParam(paramName: string, value: any, errorMsg: string) {
    const validateError: string | undefined = validateParam(this.schema, paramName, value);

    if (validateError) {
      const completeErrMsg = `${errorMsg}: ${validateError}`;

      throw new Error(completeErrMsg);
    }
  }

}
