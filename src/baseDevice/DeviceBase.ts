import Status, {StatusGetter, StatusSetter} from './Status';
import Config, {ConfigGetter, ConfigSetter} from './Config';
import System from '../app/System';
import PublishParams from '../app/interfaces/PublishParams';


type BaseParams = {[index: string]: any};
export type Publisher = (subtopic: string, value: any, params?: PublishParams) => Promise<void>;


export default class DeviceBase {
  readonly status: Status;
  readonly config: Config;
  protected readonly system: System;
  // TODO: нужно устанавливать тип для каждого девайса
  protected readonly params: BaseParams;

  protected defaultParams?: BaseParams;
  protected init?: () => void;
  protected destroy?: () => void;
  // TODO: передавать тип
  // transform initial params of device
  protected transformParams?: (params: BaseParams) => BaseParams;
  protected statusGetter?: StatusGetter;
  protected statusSetter?: StatusSetter;
  protected configGetter?: ConfigGetter;
  protected configSetter?: ConfigSetter;


  constructor(system: System, params: BaseParams) {
    this.system = system;
    this.params = this.transformDeviceParams(params);

    // TODO: наверное из конфига взять
    const statusRepublishInterval = 1000;
    const configRepublishInterval = 10000;

    this.status = new Status(
      statusRepublishInterval,
      this.publish,
      this.statusGetter,
      this.statusSetter
    );
    this.config = new Config(
      configRepublishInterval,
      this.publish,
      this.configGetter,
      this.configSetter
    );

    Promise.all([
      this.status.init(),
      this.config.init(),
    ])
      .then(() => {
        if (typeof this.init !== 'undefined') this.init();
      })
      .catch(() => {
        // TODO: что делаем ???
      });
  }

  getStatus: Status['getStatus'] = this.status.getStatus;
  getConfig: Config['getConfig'] = this.config.getConfig;
  setStatus: Status['setStatus'] = this.status.setStatus;
  setConfig: Config['setConfig'] = this.config.setConfig;

  protected publish = async (subtopic: string, value: any, params?: PublishParams): Promise<void> => {
    // TODO: топик девайса + subtopic
    // TODO: может делаться на удаленное устройство
  }

  // TODO: валидация конфига + дополнительный метод валидации девайса
  // TODO: destroy

  protected transformDeviceParams(instanceParams: BaseParams): BaseParams {
    // TODO: get it
    const thisClassName = this.constructor.name;

    const result: BaseParams = {
      ...this.defaultParams,
      ...this.system.host.config.devicesDefaults && this.system.host.config.devicesDefaults[thisClassName],
      ...instanceParams,
    };

    if (typeof this.transformParams !== 'undefined')  {
      return this.transformParams(result);
    }

    return result;
  }

}
