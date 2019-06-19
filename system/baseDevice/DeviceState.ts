import System from '../System';
import {StateObject} from '../State';
import {JsonTypes} from '../interfaces/Types';
import SchemaElement from '../interfaces/SchemaElement';
import {isEmpty} from '../helpers/lodashLike';
import {validateParam} from '../helpers/validate';
import ConsistentState from './ConsistentState';


export type Initialize = () => Promise<StateObject>;
export type Getter = (paramNames?: string[]) => Promise<StateObject>;
export type Setter = (partialData: StateObject) => Promise<void>;
export type Schema = {[index: string]: SchemaElement};


export default class DeviceState {
  private readonly system: System;
  private readonly schema: Schema;
  private readonly stateCategory: number;
  private readonly deviceId: string;
  // private readonly initialize?: Initialize;
  private readonly getter?: Getter;
  // private readonly setter?: Setter;
  private readonly consistentState: ConsistentState;


  constructor(
    system: System,
    schema: Schema,
    stateCategory: number,
    deviceId: string,
    initialize?: Initialize,
    getter?: Getter,
    setter?: Setter
  ) {
    this.system = system;
    this.schema = schema;
    this.stateCategory = stateCategory;
    this.deviceId = deviceId;
    this.getter = getter;

    this.consistentState = new ConsistentState(
      this.system,
      this.stateCategory,
      this.deviceId,
      initialize,
      this.getter,
      setter
    );
  }


  isWriting(): boolean {
    return this.consistentState.isWriting();
  }

  isReading(): boolean {
    return this.consistentState.isReading();
  }

  getState(): StateObject {
    return this.consistentState.getState();
  }

  async readAll(): Promise<StateObject> {
    if (!this.getter || this.isWriting()) return this.getState();

    // TODO: наверное сделать validate ???

    return this.consistentState.readAll();
  }

  async readParam(paramName: string): Promise<JsonTypes> {
    // TODO: !!!!
    return;
  }

  async write(partialData: StateObject): Promise<void> {
    if (isEmpty(partialData)) return;

    this.validateDict(partialData,
      `Invalid device state to write: ${this.stateCategory}, ${this.deviceId}: "${JSON.stringify(partialData)}"`);

    return this.consistentState.write(partialData);
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

}
