import * as path from 'path';

import System from './System';
import ServiceDefinition from './interfaces/ServiceDefinition';
import ServiceManifest from './interfaces/ServiceManifest';
import ServiceInstance from './interfaces/ServiceInstance';
import ServiceProps from './interfaces/ServiceProps';


type ServiceClassType = new (system: System, props: ServiceProps) => ServiceInstance;


export default class ServicesManager {
  private readonly system: System;
  private instances: {[index: string]: ServiceInstance} = {};

  constructor(system: System) {
    this.system = system;
  }

  getService<T extends ServiceInstance>(serviceId: string): T {
    const service: ServiceInstance | undefined = this.instances[serviceId];

    // TODO: эта ошибка в рантайме нужно залогировать ее но не вызывать исключение, либо делать try везде
    if (!service) throw new Error(`Can't find service "${serviceId}"`);

    return service as T;
  }

  async initSystemServices() {
    const systemServicesJsonFile = path.join(
      this.system.initCfg.rootDirs.host,
      this.system.initCfg.hostDirs.config,
      this.system.initCfg.fileNames.systemServices
    );
    const systemServicesList: string[] = await this.system.loadJson(systemServicesJsonFile);

    await this.initServices(systemServicesList);

    // TODO: после загрузки новой версии или конфига - перезагружаться
  }

  async initRegularServices() {
    const regularServicesJsonFile = path.join(
      this.system.initCfg.rootDirs.host,
      this.system.initCfg.hostDirs.config,
      this.system.initCfg.fileNames.regularServices
    );
    const regularServicesList: string[] = await this.system.loadJson(regularServicesJsonFile);

    await this.initServices(regularServicesList);
  }

  private async initServices(servicesId: string[]) {
    const definitionsJsonFile = path.join(
      this.system.initCfg.rootDirs.host,
      this.system.initCfg.hostDirs.config,
      this.system.initCfg.fileNames.servicesDefinitions
    );
    const definitions: {[index: string]: ServiceDefinition} = await this.system.loadJson(definitionsJsonFile);

    for (let serviceId of servicesId) {
      const serviceInstance: ServiceInstance = await this.instantiateService(definitions[serviceId]);

      this.instances[serviceId] = serviceInstance;
    }

    // initialize
    for (let serviceId of servicesId) {
      const serviceInstance: ServiceInstance = this.instances[serviceId];

      if (serviceInstance.init) await serviceInstance.init();
    }
  }

  private async instantiateService(serviceDefinition: ServiceDefinition): Promise<ServiceInstance> {
    const serviceDir = path.join(
      this.system.initCfg.rootDirs.host,
      this.system.initCfg.hostDirs.services,
      serviceDefinition.className
    );
    const manifestPath = path.join(serviceDir, this.system.initCfg.fileNames.manifest);
    const manifest: ServiceManifest = await this.system.loadJson(manifestPath);
    // TODO: !!!! переделать - наверное просто загружать main.js
    const mainFilePath = path.resolve(serviceDir, manifest.main);
    const ServiceClass: ServiceClassType = this.system.require(mainFilePath).default;
    const props: ServiceProps = {
      // TODO: serviceDefinition тоже имеет props
      ...serviceDefinition,
      manifest,
    };

    return new ServiceClass(this.system, props);
  }

}
