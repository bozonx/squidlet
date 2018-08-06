import Status, {StatusGetter, StatusSetter} from './Status';
import Config, {ConfigGetter, ConfigSetter} from './Config';
import System from '../app/System';


export default class BaseDevice {
  readonly status: Status;
  readonly config: Config;
  $statusGetter?: StatusGetter;
  $statusSetter?: StatusSetter;
  $configGetter?: ConfigGetter;
  $configSetter?: ConfigSetter;
  private readonly system: System;
  // TODO: нужно устанавливать тип для каждого девайса
  private readonly deviceConf: {[index: string]: any};


  constructor(system: System, deviceConf: {[index: string]: any}) {
    this.system = system;
    this.deviceConf = deviceConf;

    this.status = new Status(this.$statusGetter, this.$statusSetter);
    this.config = new Config(this.$configGetter, this.$configSetter);
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

  // async abstract $statusGetter(): Promise<void>;
  //
  // async abstract $statusSetter(): Promise<void>;
  //
  // async abstract $configGetter(): Promise<void>;
  //
  // async abstract $configSetter(): Promise<void>;

}
