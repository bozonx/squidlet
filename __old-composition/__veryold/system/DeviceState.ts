import SchemaElement from '../interfaces/PropElement';
import {isEmpty} from '../helpers/lodashLike';
import {validateParam} from '../helpers/validate';
import ConsistentState, {Getter, Setter, Initialize} from '../helpers/ConsistentState';
import {collectPropsDefaults} from '../helpers/helpers';
import {Dictionary} from '../interfaces/Types';


export type Schema = {[index: string]: SchemaElement};


/**
 * It adds layer where state can be in memory or linked to remote device via setter and getter.
 * Also state is checked corresponding its schema.
 */
export default class DeviceState {
  private readonly logError: (msg: string) => void;
  private readonly schema: Schema;
  private readonly stateGetter: () => Dictionary;
  private readonly stateUpdater: (partialState: Dictionary) => void;
  private readonly initialize?: Initialize;
  private readonly getter?: Getter;
  private readonly setter?: Setter;
  private readonly consistentState: ConsistentState;


  constructor(
    schema: Schema,
    stateGetter: () => Dictionary,
    stateUpdater: (partialState: Dictionary) => void,
    logError: (msg: string) => void,
    jobTimeoutSec?: number,
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
    this.setter = setter;

    this.consistentState = new ConsistentState(
      this.logError,
      this.stateGetter,
      this.stateUpdater,
      jobTimeoutSec,
      this.initialize,
      this.getter,
      this.setter,
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

  getState(): Dictionary {
    return this.consistentState.getState();
  }

  setIncomeState(partialState: Dictionary) {
    this.consistentState.setIncomeState(partialState);
  }

  /**
   * Load whole state. After that you can get the actual state via getState()
   */
  async load(): Promise<void> {
    if (!this.getter || this.isWriting()) return;

    await this.consistentState.load();

    this.validateDict(
      this.getState(),
      `Invalid device state readAll: "${JSON.stringify(this.consistentState.getState())}"`
    );

    return;
  }

  async write(partialData: Dictionary): Promise<void> {
    if (isEmpty(partialData)) return;

    this.validateDict(
      partialData,
      `Invalid device state to write: "${JSON.stringify(partialData)}"`
    );

    // just update current state and exit method
    if (!this.setter) {
      return this.stateUpdater(partialData);
    }

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

  // private validateParam(paramName: string, value: any, errorMsg: string) {
  //   const validateError: string | undefined = validateParam(this.schema, paramName, value);
  //
  //   if (validateError) {
  //     const completeErrMsg = `${errorMsg}: ${validateError}`;
  //
  //     throw new Error(completeErrMsg);
  //   }
  // }

}
