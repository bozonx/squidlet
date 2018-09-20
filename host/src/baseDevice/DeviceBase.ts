import {ChangeHandler, Data, Getter, Setter} from './DeviceDataManagerBase';
import Status, {DEFAULT_STATUS} from './Status';
import Config from './Config';
import PublishParams from '../app/interfaces/PublishParams';
import {EntityProps} from '../app/interfaces/EntityDefinition';
import DeviceManifest from '../app/interfaces/DeviceManifest';
import EntityBase from '../app/entities/EntityBase';


export type Publisher = (subtopic: string, value: any, params?: PublishParams) => Promise<void>;

export interface DeviceBaseProps extends EntityProps {
  statusRepublishInterval?: number;
  configRepublishInterval?: number;
}


export default class DeviceBase<Props extends DeviceBaseProps> extends EntityBase<Props> {
  protected statusGetter?: Getter;
  protected statusSetter?: Setter;
  protected configGetter?: Getter;
  protected configSetter?: Setter;
  protected actions: {[index: string]: Function} = {};
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


  protected doInit = async () => {
    const manifest: DeviceManifest = await this.getManifest<DeviceManifest>();

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
