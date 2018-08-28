import * as path from 'path';

import System from './System';
import ServiceDefinition from './interfaces/ServiceDefinition';
import ServiceManifest from './interfaces/ServiceManifest';
import ServiceInstance from './interfaces/ServiceInstance';
import systemConfig from './systemConfig';
import DriverDefinition from './interfaces/DriverDefinition';
import DriverInstance from './interfaces/DriverInstance';
import DriverManifest from './interfaces/DriverManifest';
import DriverProps from './interfaces/DriverProps';
import DeviceProps from './interfaces/DeviceProps';
import DeviceInstance from './interfaces/DeviceInstance';


type ServiceClassType = new (system: System, props: ServiceProps) => ServiceInstance;


export default class ServicesManager {
  private readonly system: System;
  private instances: {[index: string]: ServiceInstance} = {};

  constructor(system: System) {
    this.system = system;
  }

  async init(): Promise<void> {
    // TODO: будет array
    const servicesDefinitions: {[index: string]: ServiceDefinition} = this.system.host.config.services;
    const servicesManifests: {[index: string]: ServiceManifest} = this.system.host.servicesManifests;

    for (let serviceId of Object.keys(servicesDefinitions)) {
      const definition = servicesDefinitions[serviceId];
      const manifest = servicesManifests[definition.service];
      const ServiceClass = this.require(manifest.main).default;
      const instance: ServiceInstance = new ServiceClass(this.system, definition);

      this.instances.set(serviceId, instance);
    }

    // initialize all the services
    await Promise.all(Object.keys(this.instances).map(async (name: string): Promise<void> => {
      const service: ServiceInstance = this.instances.get(name);

      await service.init();
    }));
  }

  async initSystemServices() {
    // TODO: init master network configurator
    // TODO: init master updater
    // TODO: init master configurator
    // TODO: после загрузки новой версии или конфига - перезагружаться
  }

  async initRegularServices() {
    const regularServicesJsonFile = path.join(
      systemConfig.rootDirs.host,
      systemConfig.hostDirs.config,
      systemConfig.fileNames.regularServices
    );
    const regularServicesList: string[] = await this.system.loadJson(regularServicesJsonFile);

    await this.initServices(regularServicesList);
  }

  getService(serviceId: string): ServiceInstance {
    const service: ServiceInstance | undefined = this.instances.get(serviceId);

    if (!service) throw new Error(`Can't find service "${serviceId}"`);

    // TODO: как вернуть тип возвращаемого драйвера???

    return this.instances.get(serviceId);
  }


  private async initServices(servicesId: string[]) {
    const definitionsJsonFile = path.join(
      systemConfig.rootDirs.host,
      systemConfig.hostDirs.config,
      systemConfig.fileNames.servicesDefinitions
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
      systemConfig.rootDirs.host,
      systemConfig.hostDirs.services,
      serviceDefinition.className
    );
    const manifestPath = path.join(serviceDir, systemConfig.fileNames.manifest);
    const manifest: ServiceManifest = await this.system.loadJson(manifestPath);
    // TODO: !!!! переделать - наверное просто загружать main.js
    const mainFilePath = path.resolve(serviceDir, manifest.main);
    const ServiceClass: ServiceClassType = this.system.require(mainFilePath).default;
    const props: ServiceProps = {
      // TODO: driverDefinition тоже имеет props
      ...serviceDefinition,
      manifest,
    };

    return new ServiceClass(this.system, props);
  }

}
