import {ChangeHandler, Getter, Initialize, Setter} from './DeviceDataManagerBase';
import Status, {DEFAULT_STATUS} from './Status';
import Config from './Config';
import PublishParams from '../interfaces/PublishParams';
import DeviceManifest from '../interfaces/DeviceManifest';
import EntityBase from '../entities/EntityBase';
import DeviceEnv from './DeviceEnv';
import EntityDefinition from '../interfaces/EntityDefinition';
import categories from '../dict/categories';
import DeviceData from '../interfaces/DeviceData';


export interface DeviceBaseProps {
  statusRepublishInterval?: number;
  configRepublishInterval?: number;
  [index: string]: any;
}


export default class DeviceBase<Props extends DeviceBaseProps> extends EntityBase<Props> {
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
  protected transformPublishValue?: (value: any) => any;
  protected actions: {[index: string]: Function} = {};
  protected _status?: Status;
  private _config?: Config;


  protected get status(): Status | undefined {
    return this._status;
  }

  protected get config(): Config | undefined {
    return this._config;
  }

  get getConfig(): Config['read'] | undefined {
    return this.config && this.config.read;
  }

  get setConfig(): Config['write'] | undefined {
    return this.config && this.config.write;
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
        this.props.statusRepublishInterval,
      );
    }

    if (manifest.config) {
      this._config = new Config(
        this.id,
        this.env.system,
        manifest.config,
        this.props.configRepublishInterval,
      );
    }

    // listen publish events and call publish
    this.status && this.status.onPublish(this.publish);
    this.config && this.config.onPublish(this.publish);

    // handle actions call
    if (this.actions) {
      // subscribe to external messages where topic is this device id to call action
      this.env.events.addListener(categories.externalDataIncome, this.id, this.handleIncomeData);
    }

    await Promise.all([
      this.status && this.status.init(this.initialStatus, this.statusGetter, this.statusSetter),
      this.config && this.config.init(this.initialConfig, this.configGetter, this.configSetter),
    ]);
  }

  getStatus = async (statusName?: string): Promise<any> => {
    if (!this.status) {
      this.env.log.error(`You called getStatus("${statusName}") device method, but status of this devices hasn't been set. Props "${JSON.stringify(this.props)}"`);

      return;
    }

    return this.status.readParam(statusName);
  }

  setStatus = async (newValue: any, statusName: string = DEFAULT_STATUS): Promise<void> => {
    if (!this.status) {
      this.env.log.error(`You called setStatus(${JSON.stringify(newValue)}, "${statusName}") device method, but status of this devices hasn't been set. Props "${JSON.stringify(this.props)}"`);

      return;
    }

    return this.status.write({[statusName]: newValue});
  }

  /**
   * Listen status change
   */
  onChange(cb: ChangeHandler): number {
    if (!this.status) {
      this.env.log.error(`You called onChange device method, but status of this devices hasn't been set. Props "${JSON.stringify(this.props)}"`);

      return -1;
    }

    return this.status.onChange(cb);
  }

  /**
   * Call action and publish it's result.
   */
  async action(actionName: string, ...params: any[]): Promise<any> {
    if (!this.actions[actionName]) throw new Error(`Unknown action "${actionName}" of device "${this.id}"`);

    // TODO: ??? валидация входных параметров действия

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


  protected publish = (subTopic: string, value: any, params?: PublishParams) => {
    const data: DeviceData = {
      id: this.id,
      subTopic,
      data: (this.transformPublishValue) ? this.transformPublishValue(value) : value,
      params,
    };

    this.env.events.emit(categories.externalDataOutcome, this.id, data);
  }

  private handleIncomeData = (incomeData: DeviceData) => {
    return this.action(incomeData.subTopic, incomeData.data);
  }

}