import Status, {StatusGetter, StatusSetter} from './Status';
import Config, {ConfigGetter, ConfigSetter} from './Config';
import System from '../app/System';


type BaseParams = {[index: string]: any};


export default class DeviceBase {
  readonly status: Status;
  readonly config: Config;
  protected readonly system: System;
  // TODO: нужно устанавливать тип для каждого девайса
  protected readonly params: {[index: string]: any};

  // TODO: передавать тип
  // transform initial params of device
  protected init?: () => void;
  protected destroy?: () => void;
  protected transformParams?: (params: BaseParams) => BaseParams;
  protected statusGetter?: StatusGetter;
  protected statusSetter?: StatusSetter;
  protected configGetter?: ConfigGetter;
  protected configSetter?: ConfigSetter;


  constructor(system: System, params: BaseParams) {
    this.system = system;
    // TODO: сделать автоматическую трансформацию prams - из главного кокнфига и из дефолтного конфига
    this.params = (typeof this.transformParams === 'undefined') ? params : this.transformParams(params);

    // TODO: наверное из конфига взять
    const statusRepublishInterval = 1000;
    const configRepublishInterval = 10000;

    this.status = new Status(statusRepublishInterval, this.statusGetter, this.statusSetter);
    this.config = new Config(configRepublishInterval, this.configGetter, this.configSetter);

    // TODO: наверное запускать после получения статусов и конфигов или после инициализации приложения?
    if (typeof this.init !== 'undefined') this.init();
  }

  getStatus: Status['getStatus'] = this.status.getStatus;
  getConfig: Config['getConfig'] = this.config.getConfig;
  setStatus: Status['setStatus'] = this.status.setStatus;
  setConfig: Config['setConfig'] = this.config.setConfig;

  // async publishAction(actionName: string, result: any): Promise<void> {
  //   // TODO: может делаться на удаленное устройство
  // }

  // TODO: валидация конфига + дополнительный метод валидации девайса
  // TODO: destroy

}
