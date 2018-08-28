import * as path from 'path';

import System from './System';
import ServiceDefinition from './interfaces/ServiceDefinition';
import ServiceManifest from './interfaces/ServiceManifest';
import ServiceInstance from './interfaces/ServiceInstance';
import ServiceProps from './interfaces/ServiceProps';
import systemConfig from './systemConfig';
import Env from './Env';


type ServiceClassType = new (env: Env, props: ServiceProps) => ServiceInstance;


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
    const systemServicesList = await this.system.loadConfig<string[]>(
      this.system.initCfg.fileNames.systemServices
    );

    await this.initServices(systemServicesList);

    // TODO: после загрузки новой версии или конфига - перезагружаться
  }

  async initRegularServices() {
    const regularServicesList = await this.system.loadConfig<string[]>(
      this.system.initCfg.fileNames.regularServices
    );

    await this.initServices(regularServicesList);
  }


  private async initServices(servicesId: string[]) {
    const definitions = await this.system.loadConfig<{[index: string]: ServiceDefinition}>(
      this.system.initCfg.fileNames.servicesDefinitions
    );

    for (let serviceId of servicesId) {
      const serviceInstance: ServiceInstance = await this.instantiateService(definitions[serviceId]);

      this.instances[serviceId] = serviceInstance;
    }

    await this.initializeAll(servicesId);
  }

  private async initializeAll(servicesId: string[]) {
    for (let serviceId of servicesId) {
      const serviceInstance: ServiceInstance = this.instances[serviceId];

      if (serviceInstance.init) await serviceInstance.init();
    }
  }

  private async instantiateService(serviceDefinition: ServiceDefinition): Promise<ServiceInstance> {
    const serviceDir = path.join(
      systemConfig.rootDirs.host,
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

    return new ServiceClass(this.system.env, props);
  }

}
