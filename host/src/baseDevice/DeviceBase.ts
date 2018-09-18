import {ChangeHandler, Data, Getter, Setter} from './DeviceDataManagerBase';
import Status, {DEFAULT_STATUS} from './Status';
import Config from './Config';
import PublishParams from '../app/interfaces/PublishParams';
import {EntityProps} from '../app/interfaces/EntityDefinition';
import DeviceEnv from '../app/entities/DeviceEnv';
import DriverInstance from '../app/interfaces/DriverInstance';
import DeviceManifest from '../app/interfaces/DeviceManifest';
import EntityDefinition from '../app/interfaces/EntityDefinition';


export type Publisher = (subtopic: string, value: any, params?: PublishParams) => Promise<void>;

export interface DeviceBaseProps extends EntityProps {
  statusRepublishInterval?: number;
  configRepublishInterval?: number;
}

export interface DriversBase {
  [index: string]: DriverInstance;
}


export default class DeviceBase<Props extends DeviceBaseProps> {
  readonly id: string;
  readonly className: string;
  readonly props: Props;
  protected readonly env: DeviceEnv;

  // it calls after device init, status and config init have been finished
  protected afterInit?: () => void;
  protected destroy?: () => void;
  protected statusGetter?: Getter;
  protected statusSetter?: Setter;
  protected configGetter?: Getter;
  protected configSetter?: Setter;
  protected actions: {[index: string]: Function} = {};
  protected driversInstances: DriversBase = {};
  private _status?: Status;
  private _config?: Config;


  get status(): Status {
    return this._status as Status;
  }

  get config(): Config | undefined {
    return this._config;
  }

  get getConfig(): Config['read'] | undefined {
    return this.config && this.config.read;
  }

  get setConfig(): Config['write'] | undefined {
    return this.config && this.config.write;
  }

  // /**
  //  * Get driver which is dependency of device
  //  */
  // get drivers(): {[index: string]: DriverInstance} {
  //   return this.driversInstances;
  // }


  constructor(definition: EntityDefinition, env: DeviceEnv) {
    this.env = env;
    this.id = definition.id;
    this.className = definition.className;
    this.props = definition.props as Props;
  }

  async init(): Promise<void> {
    const manifest: DeviceManifest = await this.loadManifest();

    // TODO: получить ссылки на зависимые драйвера

    this._status = new Status(
      this.props.id,
      this.env.system,
      manifest.status || {},
      (...params) => this.publish(...params),
      this.props.statusRepublishInterval,
    );

    if (manifest.config) {
      this._config = new Config(
        this.props.id,
        this.env.system,
        manifest.config || {},
        (...params) => this.publish(...params),
        this.props.configRepublishInterval,
      );
    }

    await Promise.all([
      this.status && this.status.init(this.statusGetter, this.statusSetter),
      this.config && this.config.init(this.configGetter, this.configSetter),
    ]);

    if (this.afterInit) this.afterInit();
  }

  getStatus = (statusName?: string): Promise<any> => {
    return this.status.readParam(statusName);
  }

  setStatus = (newValue: any, statusName: string = DEFAULT_STATUS): Promise<void> => {
    return this.status.write({[statusName]: newValue});
  }

  onChange(cb: ChangeHandler): void {
    this.status.onChange(cb);
  }

  /**
   * Load manifest of this device
   */
  async loadManifest(): Promise<DeviceManifest> {
    return this.env.loadDeviceManifest(this.className);
  }

  /**
   * Call action and publish it's result.
   */
  async action(actionName: string, ...params: any[]): Promise<any> {
    if (!this.actions[actionName]) throw new Error(`Unknown action ${actionName}`);

    // TODO: ??? валидация входных параметров действия

    const result = await this.actions[actionName](...params);

    // TODO: если произобша ошибка наверное лучше записать в лог здесь?
    // TODO: нужны ли параметры паблиша?
    this.publish(actionName, result);

    return result;
  }

  protected publish = async (subtopic: string, value: any, params?: PublishParams): Promise<void> => {
    // TODO: передать deviceConf.deviceId, subtopic, value, params
    // TODO: может делаться на удаленное устройство
  }

  // TODO: валидация конфига + дополнительный метод валидации девайса

}
