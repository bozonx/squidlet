import Status, {DEFAULT_STATUS, StatusChangeHandler} from './Status';
import Config, {ConfigChangeHandler} from './Config';
import DeviceManifest from '../interfaces/DeviceManifest';
import EntityBase from '../entities/EntityBase';
import DeviceEnv from './DeviceEnv';
import EntityDefinition from '../interfaces/EntityDefinition';
import {JsonTypes} from '../interfaces/Types';
import {Getter, Initialize, Setter} from './ConsistentState';
import {StateObject} from '../State';


export default class DeviceBase<Props extends {[index: string]: any} = {}> extends EntityBase<Props> {
  get status(): Status | undefined {
    return this._status;
  }

  get config(): Config | undefined {
    return this._config;
  }

  get isStatusFetching(): boolean {
    if (!this.status) return false;

    return this.status.isReading() || this.status.isWriting();
  }

  get isConfigFetching(): boolean {
    if (!this.config) return false;

    return this.config.isReading() || this.config.isWriting();
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
  private _status?: Status;
  private _config?: Config;


  constructor(definition: EntityDefinition, env: DeviceEnv) {
    super(definition, env);
    this.env = env;
  }

  protected doInit = async () => {
    const manifest: DeviceManifest = await this.getManifest<DeviceManifest>();

    if (manifest.status) {
      this._status = new Status(
        this.env.system,
        manifest.status,
        this.id,
        this.initialStatus,
        this.statusGetter,
        this.statusSetter
      );
    }

    if (manifest.config) {
      this._config = new Config(
        this.env.system,
        manifest.config,
        this.id,
        this.initialConfig,
        this.configGetter,
        this.configSetter
      );
    }

    await Promise.all([
      this.status && this.status.init(),
      this.config && this.config.init(),
    ]);
  }


  /**
   * Get specified status or default status.
   * @param statusName
   */
  getStatus = async (statusName?: string): Promise<JsonTypes> => {
    if (!this.status) {
      throw new Error(`DeviceBase.getStatus: device "${this.id}", status hasn't been set.`);
    }

    return this.status.readParam(statusName);
  }

  setStatus = async (newValue: any, statusName: string = DEFAULT_STATUS): Promise<void> => {
    if (!this.status) {
      throw new Error(`DeviceBase.setStatus: device "${this.id}", status hasn't been set.`);
    }

    return this.status.write({[statusName]: newValue});
  }

  /**
   * Listen status change
   */
  onChange(cb: StatusChangeHandler): number {
    if (!this.status) {
      throw new Error(`DeviceBase.onChange: device "${this.id}", status hasn't been set.`);
    }

    return this.status.onChange(cb);
  }


  getConfig(): Promise<StateObject> {
    if (!this.config) {
      throw new Error(`DeviceBase.getConfig: device "${this.id}", config hasn't been set.`);
    }

    return this.config.read();
  }

  setConfig(partialData: StateObject): Promise<void> {
    if (!this.config) {
      throw new Error(`DeviceBase.getConfig: device "${this.id}", config hasn't been set.`);
    }

    return this.config.write(partialData);
  }

  /**
   * Listen status change
   */
  onConfigChange(cb: ConfigChangeHandler): number {
    if (!this.config) {
      throw new Error(`DeviceBase.onConfigChange: device "${this.id}", config hasn't been set.`);
    }

    return this.config.onChange(cb);
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
