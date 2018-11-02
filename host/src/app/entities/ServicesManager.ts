const _includes = require('lodash/includes');

import EntityDefinition from '../interfaces/EntityDefinition';
import ServiceInstance from '../interfaces/ServiceInstance';
import EntityManagerBase from './EntityManagerBase';
import ServiceEnv from './ServiceEnv';
import System from '../System';


export default class ServicesManager extends EntityManagerBase<ServiceInstance, ServiceEnv> {
  constructor(system: System) {
    super(system, ServiceEnv);
  }

  async initSystemServices() {
    const servicesIds: string[] = [];
    const systemServicesList: string[] = await this.system.configSet.loadConfig<string[]>(
      this.system.initCfg.fileNames.systemServices
    );
    const definitions = await this.system.configSet.loadConfig<{[index: string]: EntityDefinition}>(
      this.system.initCfg.fileNames.servicesDefinitions
    );

    for (let serviceId of Object.keys(definitions)) {
      if (_includes(systemServicesList, definitions[serviceId].className)) {
        servicesIds.push(serviceId);
      }
    }

    await this.initServices(servicesIds);
  }

  async initRegularServices() {
    const servicesIds: string[] = [];
    const regularServicesList = await this.system.configSet.loadConfig<string[]>(
      this.system.initCfg.fileNames.regularServices
    );
    const definitions = await this.system.configSet.loadConfig<{[index: string]: EntityDefinition}>(
      this.system.initCfg.fileNames.servicesDefinitions
    );

    for (let serviceId of Object.keys(definitions)) {
      if (_includes(regularServicesList, definitions[serviceId].className)) {
        servicesIds.push(serviceId);
      }
    }

    await this.initServices(servicesIds);
  }

  getService<T extends ServiceInstance>(serviceId: string): T {
    const service: ServiceInstance | undefined = this.instances[serviceId];

    // TODO: эта ошибка в рантайме нужно залогировать ее но не вызывать исключение, либо делать try везде
    if (!service) throw new Error(`Can't find service "${serviceId}"`);

    return service as T;
  }


  private async initServices(servicesIds: string[]) {
    const definitions = await this.system.configSet.loadConfig<{[index: string]: EntityDefinition}>(
      this.system.initCfg.fileNames.servicesDefinitions
    );

    for (let serviceId of servicesIds) {
      this.instances[serviceId] = await this.makeInstance('services', definitions[serviceId]);
    }

    await this.initializeAll(servicesIds);
  }

}
