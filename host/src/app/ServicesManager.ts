import System from './System';
import ServiceDefinition from './interfaces/ServiceDefinition';
import ServiceManifest from './interfaces/ServiceManifest';
import {Map} from 'immutable';
import Service from './interfaces/Service';
import * as path from "path";
import systemConfig from './systemConfig';
import DriverDefinition from './interfaces/DriverDefinition';
import DriverInstance from './interfaces/DriverInstance';


export default class ServicesManager {
  private readonly system: System;
  private instances: {[index: string]: Service} = {};

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
      const instance: Service = new ServiceClass(this.system, definition);

      this.instances.set(serviceId, instance);
    }

    // initialize all the services
    await Promise.all(Object.keys(this.instances).map(async (name: string): Promise<void> => {
      const service: Service = this.instances.get(name);

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

  private async initServices(servicesId: string[]) {
    const definitionsJsonFile = path.join(
      systemConfig.rootDirs.host,
      systemConfig.hostDirs.config,
      systemConfig.fileNames.servicesDefinitions
    );
    const definitions: {[index: string]: ServiceDefinition} = await this.system.loadJson(definitionsJsonFile);

    for (let serviceId of servicesId) {
      const serviceInstance: ServiceInstance = await this.instantiateDriver(driverName, definitions[driverName]);

      this.instances[serviceId] = serviceInstance;
    }

    for (let driverName of driverNames) {
      const driver: DriverInstance = this.instances.get(driverName);

      if (driver.init) await driver.init();
    }
  }

  getService(serviceId: string): Service {
    const service: Service | undefined = this.instances.get(serviceId);

    if (!service) throw new Error(`Can't find service "${serviceId}"`);

    // TODO: как вернуть тип возвращаемого драйвера???

    return this.instances.get(serviceId);
  }

  // it needs for test purpose
  private require(pathToFile: string) {
    return require(pathToFile);
  }

}
