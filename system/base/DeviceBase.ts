import DeviceManifest from '../interfaces/DeviceManifest';
import EntityBase from './EntityBase';
import {Dictionary, JsonTypes} from '../interfaces/Types';
import {Getter, Initialize, Setter} from '../lib/ConsistentState';
import DeviceState from '../DeviceState';
import {StateCategories} from '../interfaces/States';


export const DEFAULT_STATUS = 'default';

export type StatusChangeHandler = (paramName: string, value: JsonTypes) => void;
export type ConfigChangeHandler = () => void;


export default class DeviceBase<Props extends {[index: string]: any} = {}> extends EntityBase<Props> {
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

  //protected readonly env: EntityEnv;
  /**
   * Callback to setup initial status to not use statusGetter at init time.
   */
  protected initialStatus?: Initialize;
  protected statusGetter?: Getter;
  protected statusSetter?: Setter;
  protected initialConfig?: Initialize;
  protected configGetter?: Getter;
  protected configSetter?: Setter;
  protected actions: {[index: string]: Function} = {};
  private _statusState?: DeviceState;
  private _configState?: DeviceState;


  protected doInit = async () => {
    const manifest: DeviceManifest = await this.getManifest<DeviceManifest>();

    if (manifest.status) {
      this._statusState = new DeviceState(
        manifest.status,
        (): Dictionary => {
          return this.context.state.getState(StateCategories.devicesStatus, this.id) || {};
        },
        (partialState: Dictionary): void => {
          this.context.state.updateState(StateCategories.devicesStatus, this.id, partialState);
        },
        this.log.error,
        this.context.config.config.queueJobTimeoutSec,
        this.initialStatus,
        this.statusGetter,
        this.statusSetter
      );
    }

    if (manifest.config) {
      this._configState = new DeviceState(
        manifest.config,
        (): Dictionary => {
          return this.context.state.getState(StateCategories.devicesConfig, this.id) || {};
        },
        (partialState: Dictionary): void => {
          this.context.state.updateState(StateCategories.devicesConfig, this.id, partialState);
        },
        this.log.error,
        this.context.config.config.queueJobTimeoutSec,
        this.initialConfig,
        this.configGetter,
        this.configSetter
      );
    }

    this.context.onAppInit(async () => {
      await Promise.all([
        this.statusState && this.statusState.init(),
        this.configState && this.configState.init(),
      ]);
    });
  }


  // TODO: review - why doDestroy instead of just destroy ???
  async doDestroy() {
    await super.doDestroy();
    this._statusState && this._statusState.destroy();
    this._configState && this._configState.destroy();

    delete this._statusState;
    delete this._configState;
  }

  getActionsList(): string[] {
    return Object.keys(this.actions);
  }

  async loadManifest(className: string): Promise<DeviceManifest> {
    return this.context.system.envSet.loadManifest<DeviceManifest>('devices', className);
  }

  /**
   * Call action and return it's result.
   */
  async action(actionName: string, ...params: any[]): Promise<JsonTypes> {
    if (!this.actions[actionName]) throw new Error(`Unknown action "${actionName}" of device "${this.id}"`);

    let result: any;

    try {
      result = await this.actions[actionName](...params);
    }
    catch (err) {
      this.log.error(`Action "${actionName}" returns an error: ${err.toString()}`);

      return;
    }

    return result;
  }

  /**
   * Get specified status or default status.
   */
  getStatus = (statusName: string = DEFAULT_STATUS): JsonTypes => {
    if (!this.statusState) return;

    const state = this.statusState.getState();

    return state[statusName];
  }

  /**
   * Force load status
   */
  loadStatus = async (): Promise<void> => {
    if (!this.statusState) return;

    try {
      await this.statusState.load();
    }
    catch (err) {
      throw new Error(`Device "${this.id}" loadStatus: ${err}`);
    }
  }

  setStatus = async (newValue: any, statusName: string = DEFAULT_STATUS): Promise<void> => {
    if (!this.statusState) {
      throw new Error(`DeviceBase.setStatus: device "${this.id}", status hasn't been set.`);
    }

    try {
      await this.statusState.write({[statusName]: newValue});
    }
    catch (err) {
      throw new Error(`Device "${this.id}" setStatus: ${err}`);
    }
  }

  /**
   * Listen status change
   */
  onChange(cb: StatusChangeHandler): number {
    if (!this.statusState) {
      throw new Error(`DeviceBase.onChange: device "${this.id}", status hasn't been set.`);
    }

    const wrapper = (category: number, stateName: string, paramName: string, value: JsonTypes): void => {
      if (category !== StateCategories.devicesStatus || stateName !== this.id) return;

      cb(paramName, value);
    };

    return this.context.state.onChangeParam(wrapper);
  }

  getConfig(): Dictionary {
    if (!this.configState) return {};

    return  this.configState.getState();
  }

  /**
   * Force load config
   */
  loadConfig = async (): Promise<void> => {
    if (!this.configState) return;

    try {
      await this.configState.load();
    }
    catch (err) {
      throw new Error(`Device "${this.id}" loadConfig: ${err}`);
    }
  }

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
   * Listen status change
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

}
