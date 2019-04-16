import System from './System';
import HostConfig from './interfaces/HostConfig';
import {isEmpty} from './helpers/lodashLike';


export default class Host {
  private readonly system: System;
  private hostConfig?: HostConfig;

  get id(): string {
    return this.config.id;
  }

  get config(): HostConfig {
    return this.hostConfig as HostConfig;
  }

  constructor(system: System) {
    this.system = system;
  }


  /**
   * load config from storage
   */
  async init(): Promise<void> {

    // TODO: нет смыла это сохранять, лучше каждый раз брать из configSet где будет кэш

    this.hostConfig = await this.system.envSet.loadConfig<HostConfig>(
      this.system.initCfg.fileNames.hostConfig
    );
  }


  /**
   * Generate unique id.
   * It places here for easy testing and mocking.
   */
  generateUniqId(): string {
    // TODO: make - system id + timestamp + index

    return '1234567';
    //return generateUniqId();
  }

  /**
   * Resolve hostId by looking for device or service id in the master config.
   */
  resolveHostIdByEntityId(entityId: string): string {
    // TODO: get from config
    return 'master';
  }

  // getAllTheHostsIds(): string[] {
  //   // TODO: get from config
  //   return ['master'];
  // }

  // getAddress(type: string, bus: string): string | undefined {
  //   const addrConfig = this.config.address;
  //
  //   if (!addrConfig) return;
  //
  //   // TODO: если несколько адресов - выбрать тот что с заданным type и bus
  //
  //   return addrConfig.address;
  // }

  // generateDestination(type: string, bus: string): Destination {
  //   return {
  //     host: this.id,
  //     type,
  //     bus,
  //     address: this.getAddress(type, bus),
  //   }
  // }

  /**
   * Get object like {deviceId: [actionName, ...]}
   */
  getDevicesActions(): {[index: string]: string[]} {

    // TODO: get all the hosts from master config


    const result: {[index: string]: string[]} = {};

    const devicesIds: string[] = this.system.devicesManager.getInstantiatedDevicesIds();

    for (let devicesId of devicesIds) {
      const device = this.system.devicesManager.getDevice(devicesId);

      // TODO: review

      if (isEmpty((device as any).actions)) continue;

      result[devicesId] = Object.keys((device as any).actions);
    }

    return result;
  }

}