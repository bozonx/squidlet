import System from './System';
import HostConfig from './interfaces/HostConfig';
import HostNetworkConfig from '../network/interfaces/HostNetworkConfig';
import {generateUniqId} from '../helpers/helpers';


export default class Host {
  private readonly system: System;
  private hostConfig?: HostConfig;
  private readonly hostNetworkConfig: HostNetworkConfig;

  get id(): string {
    return this.config.id;
  }

  get config(): HostConfig {
    return this.hostConfig as HostConfig;
  }

  get networkConfig(): HostNetworkConfig {
    return this.hostNetworkConfig;
  }

  constructor(system: System) {
    this.system = system;

    // TODO: review - put into main config

    this.hostNetworkConfig = {} as HostNetworkConfig;
  }


  /**
   * load config from storage
   */
  async init(): Promise<void> {
    this.hostConfig = await this.system.configSet.loadConfig<HostConfig>(
      this.system.initCfg.fileNames.hostConfig
    );
  }


  /**
   * Generate unique id.
   * It places here for easy testing and mocking.
   */
  generateUniqId(): string {
    return generateUniqId();
  }

  /**
   * Resolve hostId by looking for device or service id in the master config.
   */
  resolveHostIdByEntityId(entityId: string): string {
    // TODO: get from config
    return 'master';
  }

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

}
