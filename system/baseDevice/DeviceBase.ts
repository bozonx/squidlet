import Status, {DEFAULT_STATUS, StatusChangeHandler} from './Status';
import Config from './Config';
import DeviceManifest from '../interfaces/DeviceManifest';
import EntityBase from '../entities/EntityBase';
import DeviceEnv from './DeviceEnv';
import EntityDefinition from '../interfaces/EntityDefinition';
import {JsonTypes} from '../interfaces/Types';
import {Getter, Initialize, Setter} from './ConsistentState';


export default class DeviceBase<Props extends {[index: string]: any} = {}> extends EntityBase<Props> {
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


  protected get status(): Status | undefined {
    return this._status;
  }

  protected get config(): Config | undefined {
    return this._config;
  }


  constructor(definition: EntityDefinition, env: DeviceEnv) {
    super(definition, env);
    this.env = env;
  }

  protected doInit = async () => {
    const manifest: DeviceManifest = await this.getManifest<DeviceManifest>();

    if (manifest.status) {
      this._status = new Status(
        this.id,
        this.env.system,
        manifest.status,
        this.initialStatus,
        this.statusGetter,
        this.statusSetter
      );
    }

    if (manifest.config) {
      this._config = new Config(
        this.id,
        this.env.system,
        manifest.config,
        this.initialConfig,
        this.configGetter,
        this.configSetter
      );
    }

    // // listen publish events and call publish
    // this.status && this.status.onPublish(this.publish);
    // this.config && this.config.onPublish(this.publish);

    await Promise.all([
      this.status && this.status.init(),
      this.config && this.config.init(),
    ]);
  }


  get getConfig(): Config['read'] | undefined {
    return this.config && this.config.read;
  }

  get setConfig(): Config['write'] | undefined {
    return this.config && this.config.write;
  }

  /**
   * Get specified status or default status.
   * @param statusName
   */
  getStatus = async (statusName?: string): Promise<JsonTypes> => {
    if (!this.status) {
      throw new Error(`You called getStatus("${statusName}") device method, but status of this devices hasn't been set. Props "${JSON.stringify(this.props)}"`);
    }

    return this.status.readParam(statusName);
  }

  getActionsList(): string[] {
    return Object.keys(this.actions);
  }

  /**
   * Listen status change
   */
  onChange(cb: StatusChangeHandler): number {
    if (!this.status) {
      throw new Error(`You called onChange method of device "${this.id}", but status of this devices hasn't been set. Props "${JSON.stringify(this.props)}"`);
    }

    return this.status.onChange(cb);
  }

  setStatus = async (newValue: any, statusName: string = DEFAULT_STATUS): Promise<void> => {
    if (!this.status) {
      throw new Error(`You called setStatus(${JSON.stringify(newValue)}, "${statusName}") device method, but status of this devices hasn't been set. Props "${JSON.stringify(this.props)}"`);
    }

    return this.status.write({[statusName]: newValue});
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
