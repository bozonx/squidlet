import {Data, Getter, Setter} from './DeviceDataManagerBase';
import Status, {DEFAULT_STATUS} from './Status';
import Config from './Config';
import System from '../app/System';
import PublishParams from '../app/interfaces/PublishParams';
import DeviceConf from '../app/interfaces/DeviceConf';


export type Publisher = (subtopic: string, value: any, params?: PublishParams) => Promise<void>;


export default class DeviceBase {
  readonly status: Status;
  readonly config: Config;
  protected readonly system: System;
  protected readonly deviceConf: DeviceConf;

  protected afterInit?: () => void;
  protected destroy?: () => void;
  protected statusGetter?: Getter;
  protected statusSetter?: Setter;
  protected configGetter?: Getter;
  protected configSetter?: Setter;
  protected actions: {[index: string]: Function} = {};


  constructor(system: System, deviceConf: DeviceConf) {
    this.system = system;
    this.deviceConf = deviceConf;

    this.status = new Status(
      this.deviceConf.deviceId,
      this.system,
      this.deviceConf.manifest.status || {},
      this.publish,
      this.deviceConf.props.statusRepublishInterval,
      this.statusGetter,
      this.statusSetter
    );
    this.config = new Config(
      this.deviceConf.deviceId,
      this.system,
      this.deviceConf.manifest.config || {},
      this.publish,
      this.deviceConf.props.configRepublishInterval,
      this.configGetter,
      this.configSetter
    );

    Promise.all([
      this.status.init(),
      this.config.init(),
    ])
      .then(() => {
        if (typeof this.afterInit !== 'undefined') this.afterInit();
      })
      .catch(() => {
        // TODO: что делаем ???
      });
  }

  getStatus = (statusName?: string): Promise<any> => {
    return this.status.readParam(statusName);
  }
  getConfig = (): Promise<Data> => {
    return this.config.read();
  }
  setStatus = (newValue: any, statusName: string = DEFAULT_STATUS): Promise<void> => {
    return this.status.write({[statusName]: newValue});
  }
  setConfig = (partialData: Data): Promise<void> => {
    return this.config.write(partialData);
  }

  /**
   * Call action and publish it's result.
   */
  async action(actionName: string, ...params: any[]): Promise<any> {
    if (!this.actions[actionName]) throw new Error(`Unknown action ${actionName}`);

    // TODO: валидация входных параметров действия

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
