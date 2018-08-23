import System from './System';
import ServiceDefinition from './interfaces/ServiceDefinition';
import ServiceManifest from './interfaces/ServiceManifest';
import {Map} from 'immutable';
import Service from './interfaces/Service';


export default class Services {
  private readonly system: System;
  private instances: Map<string, Service> = Map<string, Service>();

  constructor(system: System) {
    this.system = system;
  }

  async init(): Promise<void> {
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
