import System from './System';
// import Destination from '../network/interfaces/Destination';
// import DeviceManifest from './interfaces/DeviceManifest';
// import DeviceConf from './interfaces/DeviceConf';
import HostConfig from './interfaces/HostConfig';
import * as _ from 'lodash';
import configHostPlatform from './configHostPlatform';
import configHostDefault from './configHostDefault';
import HostNetworkConfig from '../network/interfaces/HostNetworkConfig';


// TODO: ??? use immutable

export default class Host {
  private readonly system: System;
  private readonly hostConfig: HostConfig;
  private readonly hostNetworkConfig: HostNetworkConfig;

  get id(): string {

    // TODO: review

    //return this.hostConfig.address.host;

    // if (this.hostConfig.slave) return this.hostConfig.address.host;
    //
    return 'master';
  }

  // /**
  //  * Manifests by device class name
  //  */
  // get devicesManifests(): {[index: string]: DeviceManifest} {
  //   return this.hostConfig.devicesManifests;
  // }

  // /**
  //  * Devices config by ids
  //  */
  // get devicesConfigs(): {[index: string]: DeviceConf} {
  //   return this.hostConfig.devicesConfigs;
  // }

  // get driversList(): Array<string> {
  //   return this.hostConfig.drivers;
  // }

  /**
   * Full host config
   */
  get config(): HostConfig {
    return this.hostConfig;
  }

  get networkConfig(): HostNetworkConfig {
    return this.hostNetworkConfig;
  }

  constructor(system: System, hostConfig: HostConfig) {
    this.system = system;
    this.hostConfig = this.mergeConfigs(hostConfig);

    // TODO: откуда его взять

    this.hostNetworkConfig = {} as HostNetworkConfig;
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


  private mergeConfigs(specifiedConfig: HostConfig): HostConfig {
    return {
      ...specifiedConfig,
      host: {
        ..._.defaultsDeep({ ...specifiedConfig.host }, configHostPlatform, configHostDefault),
      }
    }
  }

}
