import DeviceManifest from '../interfaces/DeviceManifest';
import EntityBase from '../entities/EntityBase';
import DeviceEnv from './DeviceEnv';
import EntityDefinition from '../interfaces/EntityDefinition';
import {JsonTypes} from '../interfaces/Types';
import {Getter, Initialize, Setter} from './ConsistentState';
import {StateObject} from '../State';
import DeviceState from './DeviceState';
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

  protected readonly env: DeviceEnv;
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


  constructor(definition: EntityDefinition, env: DeviceEnv) {
    super(definition, env);
    this.env = env;
  }

  protected doInit = async () => {
    const manifest: DeviceManifest = await this.getManifest<DeviceManifest>();

    if (manifest.status) {
      this._statusState = new DeviceState(
        manifest.status,
        (): StateObject => {
          return this.env.system.state.getState(StateCategories.devicesStatus, this.id) || {};
        },
        (partialState: StateObject): void => {
          this.env.system.state.updateState(StateCategories.devicesStatus, this.id, partialState);
        },
        this.env.system.log.error,
        this.initialStatus,
        this.statusGetter,
        this.statusSetter
      );
    }

    if (manifest.config) {
      this._configState = new DeviceState(
        manifest.config,
        (): StateObject => {
          return this.env.system.state.getState(StateCategories.devicesConfig, this.id) || {};
        },
        (partialState: StateObject): void => {
          this.env.system.state.updateState(StateCategories.devicesConfig, this.id, partialState);
        },
        this.env.system.log.error,
        this.initialConfig,
        this.configGetter,
        this.configSetter
      );
    }

    this.env.system.onAppInit(async () => {
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
      this.env.log.error(`Action "${actionName}" returns an error: ${err.toString()}`);

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
      return this.statusState.write({[statusName]: newValue});
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

    return this.env.system.state.onChangeParam(wrapper);
  }

  getConfig(): StateObject {
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

  setConfig = async (partialData: StateObject): Promise<void> => {
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

    return this.env.system.state.onChange(wrapper);
  }

}
