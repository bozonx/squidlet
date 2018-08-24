import DeviceManifest from './interfaces/DeviceManifest';

const _defaultsDeep = require('lodash/defaultsDeep');
import System from './System';
// import Destination from '../network/interfaces/Destination';
// import DeviceConf from './interfaces/DeviceConf';
import HostConfig from './interfaces/HostConfig';
import configHostPlatform from './configHostPlatform';
import configHostDefault from './configHostDefault';
import HostNetworkConfig from '../network/interfaces/HostNetworkConfig';
import DriverManifest from './interfaces/DriverManifest';
import ServiceManifest from './interfaces/ServiceManifest';


// TODO: ??? use immutable

export default class Host {
  private readonly system: System;
  private readonly hostConfig: HostConfig;
  private readonly hostNetworkConfig: HostNetworkConfig;

  // TODO: config - почему бы не брать общий конфиг в таком виде как передан в приложение ?

  get id(): string {

    // TODO: review
    // TODO: может использовать network.hostId

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
  //  * DevicesManager config by ids
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

  // parsed devices manifests by device's class name
  get devicesManifests(): {[index: string]: DeviceManifest} {

  }

  // TODO: почему тут список а в других местах объект?
  // parsed and sorted drivers manifests
  get driversManifests(): DriverManifest[] {

  }

  // parsed manifests of services
  get servicesManifests(): {[index: string]: ServiceManifest} {

  }

  constructor(system: System, hostConfig: HostConfig) {
    this.system = system;

    // TODO: прочитать разово с диска и удалить из памяти
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
    // TODO: не нужно

    return {
      ...specifiedConfig,
      host: {
        ..._defaultsDeep({ ...specifiedConfig.host }, configHostPlatform, configHostDefault),
      }
    }
  }

}
