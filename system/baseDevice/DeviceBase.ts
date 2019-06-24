import StatusState, {DEFAULT_STATUS, StatusChangeHandler} from './StatusState';
import ConfigState, {ConfigChangeHandler} from './ConfigState';
import DeviceManifest from '../interfaces/DeviceManifest';
import EntityBase from '../entities/EntityBase';
import DeviceEnv from './DeviceEnv';
import EntityDefinition from '../interfaces/EntityDefinition';
import {JsonTypes} from '../interfaces/Types';
import {Getter, Initialize, Setter} from './ConsistentState';
import {StateObject} from '../State';


export default class DeviceBase<Props extends {[index: string]: any} = {}> extends EntityBase<Props> {
  get statusState(): StatusState | undefined {
    return this._statusState;
  }

  get configState(): ConfigState | undefined {
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
  private _statusState?: StatusState;
  private _configState?: ConfigState;


  constructor(definition: EntityDefinition, env: DeviceEnv) {
    super(definition, env);
    this.env = env;
  }

  protected doInit = async () => {
    const manifest: DeviceManifest = await this.getManifest<DeviceManifest>();

    if (manifest.status) {
      this._status = new StatusState(
        this.env.system,
        manifest.status,
        this.id,
        this.initialStatus,
        this.statusGetter,
        this.statusSetter
      );
    }

    if (manifest.config) {
      this._config = new ConfigState(
        this.env.system,
        manifest.config,
        this.id,
        this.initialConfig,
        this.configGetter,
        this.configSetter
      );
    }

    await Promise.all([
      this.statusState && this.statusState.init(),
      this.configState && this.configState.init(),
    ]);
  }

  // TODO: add destroy - status and config


  /**
   * Get specified status or default status.
   * @param statusName
   */
  getStatus = async (statusName?: string): Promise<JsonTypes> => {
    if (!this.statusState) {
      throw new Error(`DeviceBase.getStatus: device "${this.id}", status hasn't been set.`);
    }

    return this.statusState.readParam(statusName);
  }

  setStatus = async (newValue: any, statusName: string = DEFAULT_STATUS): Promise<void> => {
    if (!this.statusState) {
      throw new Error(`DeviceBase.setStatus: device "${this.id}", status hasn't been set.`);
    }

    return this.statusState.write({[statusName]: newValue});
  }

  /**
   * Listen status change
   */
  onChange(cb: StatusChangeHandler): number {
    if (!this.statusState) {
      throw new Error(`DeviceBase.onChange: device "${this.id}", status hasn't been set.`);
    }

    return this.statusState.onChange(cb);
  }


  getConfig(): Promise<StateObject> {
    if (!this.configState) {
      throw new Error(`DeviceBase.getConfig: device "${this.id}", config hasn't been set.`);
    }

    return this.configState.read();
  }

  setConfig(partialData: StateObject): Promise<void> {
    if (!this.configState) {
      throw new Error(`DeviceBase.getConfig: device "${this.id}", config hasn't been set.`);
    }

    return this.configState.write(partialData);
  }

  /**
   * Listen status change
   */
  onConfigChange(cb: ConfigChangeHandler): number {
    if (!this.configState) {
      throw new Error(`DeviceBase.onConfigChange: device "${this.id}", config hasn't been set.`);
    }

    return this.configState.onChange(cb);
  }


  getActionsList(): string[] {
    return Object.keys(this.actions);
  }

  /**
   * Call action and publish it's result.
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

    // TODO: если публиковать результат действия то происходит зацикливание

    // publish action's result where subtopic is action name
    //this.publish(actionName, result);

    return result;
  }

}

// protected publish = (subTopic: string, value: any, isRepeat?: boolean) => {
//   const topic: string = combineTopic(this.env.system.systemConfig.topicSeparator, this.id, subTopic);
//   const data = String((this.transformPublishValue) ? this.transformPublishValue(value) : value);
//
//   // T-O-D-O: наверное надо установить стейт а не publish
//
//   this.env.api.publish(topic, data, isRepeat);
// }

// // handle actions call
// if (this.actions) {
//   // subscribe to external messages where topic is this device id to call action
//   //this.env.events.addListener(categories.externalDataIncome, this.id, this.handleIncomeData);
//   this.env.api.onIncome(this.handleIncomeData);
// }
// private handleIncomeData = (type: ApiTypes, apiPayload: ApiPayload) => {
//   if (type !== 'deviceIncome') return;
//
//   const payload = apiPayload as DeviceIncomePayload;
//
//   if (payload.deviceId !== this.id) return;
//
//   return this.action(payload.action, ...payload.params);
// }
