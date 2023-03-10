import SchemaElement from '../../interfaces/SchemaElement';
import {isEmptyObject} from '../objects';
import {validateParam} from '../validate';
import ConsistentState, {Getter, Setter, Initialize} from '../ConsistentState';
import {collectPropsDefaults} from '../helpers';
import {Dictionary} from '../../interfaces/Types';


export type Schema = {[index: string]: SchemaElement};


/**
 * It adds layer where state can be in memory or linked to remote device via setter and getter.
 * Also state is checked corresponding its schema.
 */
export default class DeviceState extends ConsistentState {
  private readonly schema: Schema;
  private readonly deviceId: string;
  private readonly logDebug: (msg: string) => void;


  constructor(
    schema: Schema,
    stateGetter: () => Dictionary,
    stateUpdater: (partialState: Dictionary) => void,
    deviceId: string,
    logDebug: (msg: string) => void,
    logError: (msg: string) => void,
    jobTimeoutSec?: number,
    initialize?: Initialize,
    getter?: Getter,
    setter?: Setter,
  ) {
    super(
      logError,
      stateGetter,
      stateUpdater,
      jobTimeoutSec,
      initialize,
      getter,
      setter,
    );

    this.schema = schema;
    this.deviceId = deviceId;
    this.logDebug = logDebug;
  }

  // TODO: test
  async init() {
    if (!this.getter && !this.initialize) {
      // TODO: job может выполниться мгновенно!
      this.initialize = async (): Promise<Dictionary> => {
        return collectPropsDefaults(this.schema);
      };

      return;
    }

    await super.init();

    this.validateDict(
      this.getState(),
      `Invalid device state on init: "${JSON.stringify(this.getState())}"`
    );
  }

  // TODO: test
  /**
   * Load whole state and validate it. After that you can get the actual state via getState()
   */
  async load(): Promise<void> {
    await super.load();

    this.validateDict(
      this.getState(),
      `Invalid device state on load: "${JSON.stringify(this.getState())}"`
    );
  }

  // TODO: test
  /**
   * Validate data which will be saved and save it.
   */
  async write(partialData: Dictionary): Promise<void> {
    if (isEmptyObject(partialData)) return;

    this.validateDict(
      partialData,
      `Invalid device state to write: "${JSON.stringify(partialData)}"`
    );

    this.logDebug(`DeviceState.write: deviceId: ${this.deviceId}, ${JSON.stringify(partialData)}`);

    return super.write(partialData);
  }


  // TODO: test
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


// private validateParam(paramName: string, value: any, errorMsg: string) {
//   const validateError: string | undefined = validateParam(this.schema, paramName, value);
//
//   if (validateError) {
//     const completeErrMsg = `${errorMsg}: ${validateError}`;
//
//     throw new Error(completeErrMsg);
//   }
// }
