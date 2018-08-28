import {ChangeHandler, Data, Getter, Setter} from './DeviceDataManagerBase';
import Status, {DEFAULT_STATUS} from './Status';
import Config from './Config';
import System from '../app/System';
import PublishParams from '../app/interfaces/PublishParams';
import DeviceDefinition from '../app/interfaces/DeviceDefinition';


export type Publisher = (subtopic: string, value: any, params?: PublishParams) => Promise<void>;


export default class DeviceBase {
  readonly status: Status;
  readonly config?: Config;
  readonly getConfig?: Config['read'];
  readonly setConfig?: Config['write'];
  protected readonly system: System;
  // TODO: или это props ???
  protected readonly deviceConf: DeviceDefinition;

  // better place to do initial requests
  protected onInit?: () => Promise<void>;
  // it calls after device init, status and config init have been finished
  protected afterInit?: () => void;
  protected destroy?: () => void;
  protected statusGetter?: Getter;
  protected statusSetter?: Setter;
  protected configGetter?: Getter;
  protected configSetter?: Setter;
  protected actions: {[index: string]: Function} = {};


  constructor(system: System, deviceConf: DeviceDefinition) {
    this.system = system;
    this.deviceConf = deviceConf;

    this.status = new Status(
      this.deviceConf.deviceId,
      this.system,
      this.deviceConf.manifest.status || {},
      (...params) => this.publish(...params),
      this.deviceConf.props.statusRepublishInterval,
    );

    if (this.deviceConf.manifest.config) {
      this.config = new Config(
        this.deviceConf.deviceId,
        this.system,
        this.deviceConf.manifest.config || {},
        (...params) => this.publish(...params),
        this.deviceConf.props.configRepublishInterval,
      );

      this.getConfig = this.config.read;
      this.setConfig = this.config.write;
    }
  }

  async init(): Promise<void> {
    try {
      await Promise.all([
        this.status && this.status.init(this.statusGetter, this.statusSetter),
        this.config && this.config.init(this.configGetter, this.configSetter),
        this.onInit && this.onInit(),
      ]);
    }
    catch (err) {
      throw new Error(err);
    }

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

  // TODO: как сделать чтобы props имел тип???
  // TODO: валидация конфига + дополнительный метод валидации девайса
  // TODO: destroy

}
