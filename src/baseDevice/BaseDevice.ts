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

  /**
   * Get status from device.
   */
  async getStatus(statusName: string = 'default'): Promise<void> {

  }

  /**
   * Get whole config from device.
   */
  async getConfig(): Promise<void> {

  }

  /**
   * Set status of device.
   */
  async setStatus(newValue: any, statusName: string = 'default'): Promise<void> {

  }

  /**
   * Set config to device
   */
  async setConfig(partialConfig: {[index: string]: any}): Promise<void> {

  }

  // async publishAction(actionName: string, result: any): Promise<void> {
  //   // TODO: может делаться на удаленное устройство
  // }

}
