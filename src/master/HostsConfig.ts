import PreServiceManifest from './interfaces/PreServiceManifest';
import ServiceDefinition from '../app/interfaces/ServiceDefinition';
import MasterConfig from './interfaces/MasterConfig';
import Manifests from './Manifests';
import HostConfig from '../app/interfaces/HostConfig';


export default class HostsConfig {
  private readonly masterConfig: MasterConfig;
  private readonly manifests: Manifests;
  // hosts configs by hostId
  private hostsConfig: {[index: string]: HostConfig} = {};


  constructor(masterConfig: MasterConfig, manifests: Manifests) {
    this.masterConfig = masterConfig;
    this.manifests = manifests;
  }

  // TODO: !!!! add devs specified to platform

  generate() {
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

}
