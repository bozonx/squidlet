import PreServiceManifest from './interfaces/PreServiceManifest';
import ServiceDefinition from '../app/interfaces/ServiceDefinition';
import MasterConfig from './interfaces/MasterConfig';
import Manifests from './Manifests';
import HostConfig from '../app/interfaces/HostConfig';
import PreHostConfig from './interfaces/PreHostConfig';


export default class HostsConfigGenerator {
  private readonly masterConfig: MasterConfig;
  private readonly manifests: Manifests;
  // hosts configs by hostId
  private hostsConfigs: {[index: string]: HostConfig} = {};


  constructor(masterConfig: MasterConfig, manifests: Manifests) {
    this.masterConfig = masterConfig;
    this.manifests = manifests;
  }

  // TODO: !!!! add devs specified to platform

  generate() {
    const hosts = this.getHosts();


    // TODO: передать общиие параметры - взять из hostDefaults и в определении самого хоста
    // TODO: воткнуть все используемые манифесты
    // TODO: сформировать определения девайсов
    // TODO: сформировать определения сервисов
    // TODO: сформировать driversConfigs
  }

  private generateServices(
    servicesManifests: {[index: string]: PreServiceManifest}
  ): {[index: string]: ServiceDefinition} {
    // TODO: слить props
    // TODO: сформировать service definition - вставить из манифеста что нужно

  }

  private getHosts() {
    if (!this.masterConfig.host || this.masterConfig.hosts) {
      throw new Error(`Master config doesn't have "host" or "hosts" params`);
    }

    let hosts: PreHostConfig[] = [];

    if (this.masterConfig.hosts) {
      hosts = this.masterConfig.hosts;
    }
    else if (this.masterConfig.host) {
      hosts = [this.masterConfig.host];
    }

    return hosts;
  }

}
