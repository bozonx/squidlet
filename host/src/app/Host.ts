import * as path from 'path';
const _defaultsDeep = require('lodash/defaultsDeep');
import * as uniqid from 'uniqid';

import FsDev from './interfaces/dev/Fs.dev';
import DeviceManifest from './interfaces/DeviceManifest';
import System from './System';
import HostConfig from './interfaces/HostConfig';
import HostNetworkConfig from '../network/interfaces/HostNetworkConfig';
import DriverManifest from './interfaces/DriverManifest';
import ServiceManifest from './interfaces/ServiceManifest';
import systemConfig from './config/systemConfig';


// TODO: ??? use immutable

export default class Host {
  private readonly system: System;
  private hostConfig?: HostConfig;
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

  get config(): HostConfig {
    return this.hostConfig as HostConfig;
  }

  get networkConfig(): HostNetworkConfig {
    return this.hostNetworkConfig;
  }

  constructor(system: System) {
    this.system = system;


    // TODO: откуда его взять

    this.hostNetworkConfig = {} as HostNetworkConfig;
  }

  generateUniqId(): string {
    // TODO: почему не используется из helpers ???
    return uniqid();
  }


  /**
   * load config from storage
   */
  async init(): Promise<void> {
    this.hostConfig = await this.system.configSet.loadConfig<HostConfig>(
      this.system.initCfg.fileNames.hostConfig
    );
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
