import Status, {StatusGetter, StatusSetter} from './Status';
import Config, {ConfigGetter, ConfigSetter} from './Config';
import System from '../app/System';


export default class BaseDevice {
  readonly status: Status;
  readonly config: Config;
  protected $statusGetter?: StatusGetter;
  protected $statusSetter?: StatusSetter;
  protected $configGetter?: ConfigGetter;
  protected $configSetter?: ConfigSetter;
  private readonly system: System;
  // TODO: нужно устанавливать тип для каждого девайса
  private readonly deviceConf: {[index: string]: any};


  constructor(system: System, deviceConf: {[index: string]: any}) {
    this.system = system;
    this.deviceConf = deviceConf;

    // TODO: наверное из конфига взять
    const statusRepublishInterval = 1000;
    const configRepublishInterval = 10000;

    this.status = new Status(statusRepublishInterval, this.$statusGetter, this.$statusSetter);
    this.config = new Config(configRepublishInterval, this.$configGetter, this.$configSetter);
  }

  getStatus: Status['getStatus'] = this.status.getStatus;
  getConfig: Config['getConfig'] = this.config.getConfig;
  setStatus: Status['setStatus'] = this.status.setStatus;
  setConfig: Config['setConfig'] = this.config.setConfig;

  // async publishAction(actionName: string, result: any): Promise<void> {
  //   // TODO: может делаться на удаленное устройство
  // }

}
