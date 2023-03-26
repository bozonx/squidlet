import DeviceManifest from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/DeviceManifest.js';
import EntityBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/EntityBase.js';
import {Dictionary, JsonTypes} from '../../../../squidlet-lib/src/interfaces/Types';
import {Getter, Initialize, Setter} from '../../../../squidlet-lib/src/ConsistentState';
import DeviceState from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/logic/DeviceState.js';
import {StateCategories} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/States.js';
import {DEFAULT_DEVICE_STATUS} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/constants.js';
import Promised from '../../../../squidlet-lib/src/Promised';
import Context from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/system/Context.js';
import EntityDefinition from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityDefinition.js';


export type DeviceAction = (...param: any[]) => JsonTypes | void | Promise<JsonTypes | void>;
export type StatusChangeHandler = (paramName: string, value?: JsonTypes) => void;
export type ConfigChangeHandler = () => void;


export default class DeviceBase<
  Props extends {[index: string]: any} = {}
> extends EntityBase<Props, DeviceManifest> {
  readonly entityType = 'device';

  get statusState(): DeviceState | undefined {
    return this._statusState;
  }

  get configState(): DeviceState | undefined {
    return this._configState;
  }

  get isStatusFetching(): boolean {
    if (!this.statusState) return false;

    return this.statusState.isReading() || this.statusState.isWriting();
  }

  get isConfigFetching(): boolean {
    if (!this.configState) return false;

    return this.configState.isReading() || this.configState.isWriting();
  }

  // define it to do initialization after states have inited.
  protected didInit?(): Promise<void>;
  /**
   * Callback to setup initial status to not use statusGetter at init time.
   */
  protected initialStatus?: Initialize;
  protected statusGetter?: Getter;
  protected statusSetter?: Setter;
  protected initialConfig?: Initialize;
  protected configGetter?: Getter;
  protected configSetter?: Setter;

  protected actions: {[index: string]: DeviceAction} = {};

  private _statusState?: DeviceState;
  private _configState?: DeviceState;
  private initPromised?: Promised<void>;


  constructor(context: Context, definition: EntityDefinition) {
    super(context, definition);

    this.initPromised = new Promised<void>();
  }

  init = async () => {
    const manifest: DeviceManifest = await this.getManifest();

    if (manifest.status) {
      this._statusState = this.instantiateState(
        manifest.status,
        StateCategories.devicesStatus,
        this.initialStatus,
        this.statusGetter,
        this.statusSetter
      );
    }

    if (manifest.config) {
      this._statusState = this.instantiateState(
        manifest.config,
        StateCategories.devicesConfig,
        this.initialConfig,
        this.configGetter,
        this.configSetter
      );
    }

    // initialize status and config after all the devices has been initialized
    if (manifest.status || manifest.config) {
      this.context.onDevicesInit(async () => {
        this.log.debug(`Init status and config of device ${this.id} if set`);
        // TODO: review - будет делаться запись которая ждет окончания инициализации в pcf - поэтому зависнет
        Promise.all([
          this.statusState && this.statusState.init(),
          this.configState && this.configState.init(),
        ])
          .catch(this.log.error);
      });
    }

    // call didInit handler of device if set
    if (this.didInit) await this.didInit();

    if (!this.initPromised) throw new Error(`no initPromised`);

    this.initPromised.resolve();
    this.initPromised.destroy();

    delete this.initPromised;
  }

  destroy = async () => {
    this._statusState && this._statusState.destroy();
    this._configState && this._configState.destroy();

    delete this._statusState;
    delete this._configState;
  }


  // TODO: review
  onInit(cb: () => void) {
    const callCb = () => {
      try {
        cb();
      }
      catch (e) {
        this.log.error(e);
      }
    };

    if (!this.initPromised) return callCb();

    this.initPromised.promise
      .then(callCb);
  }

  getActionsList(): string[] {
    return Object.keys(this.actions);
  }

  /**
   * Call action and return it's result.
   */
  async action(actionName: string, ...args: any[]): Promise<JsonTypes | void> {
    if (!this.actions[actionName]) {
      throw new Error(`Unknown action "${actionName}" of device "${this.id}"`);
    }

    return this.actions[actionName](...args);
  }

  /**
   * Get specified status or default status.
   */
  getStatus = (statusName: string = DEFAULT_DEVICE_STATUS): JsonTypes | undefined => {
    if (!this.statusState) return;

    const state = this.statusState.getState();

    return state[statusName];
  }

  /**
   * Set status params value
   */
  setStatus = async (newValue: any, statusName: string = DEFAULT_DEVICE_STATUS): Promise<void> => {
    if (!this.statusState) {
      throw new Error(`DeviceBase.setStatus: device "${this.id}", status hasn't been set.`);
    }

    try {
      await this.statusState.write({[statusName]: newValue});
    }
    catch (err) {
      throw new Error(`DeviceBase.setStatus: device "${this.id}", ${err}`);
    }
  }

  /**
   * Listen to status change. Cb will be called on changing of every params.
   */
  onChange(cb: StatusChangeHandler): number {
    if (!this.statusState) {
      throw new Error(`DeviceBase.onChange: device "${this.id}", don't have the status.`);
    }

    const wrapper = (category: number, stateName: string, changedParams: string[]): void => {
      if (category !== StateCategories.devicesStatus || stateName !== this.id) return;

      const currentState: Dictionary | undefined = this.context.state.getState(StateCategories.devicesStatus, this.id);

      if (!currentState) {
        return this.log.error(`DeviceBase.onChange: Can't get state of status`);
      }

      for (let paramName of changedParams) {
        cb(paramName, currentState[paramName]);
      }
    };

    return this.context.state.onChange(wrapper);
  }

  /**
   * Get while config
   */
  getConfig(): Dictionary {
    if (!this.configState) return {};

    return  this.configState.getState();
  }

  /**
   * Set whole config
   * @param partialData
   */
  setConfig = async (partialData: Dictionary): Promise<void> => {
    if (!this.configState) {
      throw new Error(`DeviceBase.getConfig: device "${this.id}", config hasn't been set.`);
    }

    try {
      await this.configState.write(partialData);
    }
    catch (err) {
      throw new Error(`Device "${this.id}" setConfig: ${err}`);
    }
  }

  /**
   * Listen to any change of config.
   */
  onConfigChange(cb: ConfigChangeHandler): number {
    if (!this.configState) {
      throw new Error(`DeviceBase.onConfigChange: device "${this.id}", config hasn't been set.`);
    }

    const wrapper = (category: number, stateName: string): void => {
      if (category !== StateCategories.devicesConfig || stateName !== this.id) return;

      cb();
    };

    return this.context.state.onChange(wrapper);
  }


  private instantiateState(
    schema: {[index: string]: any},
    stateCategory: StateCategories,
    initialCb?: Initialize,
    getterCb?: Getter,
    setterCb?: Setter
  ): DeviceState {
    return new DeviceState(
      schema,
      (): Dictionary => {
        return this.context.state.getState(stateCategory, this.id) || {};
      },
      (partialState: Dictionary): void => {
        this.context.state.updateState(stateCategory, this.id, partialState);
      },
      this.id,
      this.log.debug,
      this.log.error,
      this.context.config.config.queueJobTimeoutSec,
      initialCb,
      getterCb,
      setterCb
    );
  }

}


// /**
//  * Force load status whole status.
//  */
// loadStatus = async (): Promise<void> => {
//   if (!this.statusState) return;
//
//   try {
//     await this.statusState.load();
//   }
//   catch (err) {
//     throw new Error(`Device "${this.id}" loadStatus: ${err}`);
//   }
// }

// /**
//  * Force load whole config.
//  */
// loadConfig = async (): Promise<void> => {
//   if (!this.configState) return;
//
//   try {
//     await this.configState.load();
//   }
//   catch (err) {
//     throw new Error(`Device "${this.id}" loadConfig: ${err}`);
//   }
// }
