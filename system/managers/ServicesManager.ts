import EntityDefinition from '../interfaces/EntityDefinition';
import EntityManagerBase from './EntityManagerBase';
import ServiceBase from '../entities/ServiceBase';


export default class ServicesManager extends EntityManagerBase<ServiceBase> {
  async initSystemServices() {
    const systemServicesList: string[] = await this.context.system.envSet.loadConfig<string[]>(
      this.context.system.initializationConfig.fileNames.systemServices
    );
    const servicesIds: string[] = await this.generateServiceIdsList(systemServicesList);

    await this.initServices(servicesIds);
  }

  async initRegularServices() {
    const regularServicesList = await this.context.system.envSet.loadConfig<string[]>(
      this.context.system.initializationConfig.fileNames.regularServices
    );
    const servicesIds: string[] = await this.generateServiceIdsList(regularServicesList);

    await this.initServices(servicesIds);
  }

  getService<T extends ServiceBase>(serviceId: string): T {
    const service: ServiceBase | undefined = this.instances[serviceId];

    if (!service) {
      this.context.log.error(`ServicesManager.getService: Can't find the service "${serviceId}"`);
      throw new Error(`Can't find the service "${serviceId}"`);
    }

    return service as T;
  }


  private async initServices(servicesIds: string[]) {
    const definitions = await this.context.system.envSet.loadConfig<{[index: string]: EntityDefinition}>(
      this.context.system.initializationConfig.fileNames.servicesDefinitions
    );

    for (let serviceId of servicesIds) {
      this.instances[serviceId] = await this.makeInstance('services', definitions[serviceId]);
    }

    await this.initializeAll(servicesIds);
  }

  private async generateServiceIdsList(allowedClassNames: string[]): Promise<string[]> {
    const servicesIds: string[] = [];
    const definitions = await this.context.system.envSet.loadConfig<{[index: string]: EntityDefinition}>(
      this.context.system.initializationConfig.fileNames.servicesDefinitions
    );

    for (let serviceId of Object.keys(definitions)) {
      if (allowedClassNames.includes(definitions[serviceId].className)) {
        servicesIds.push(serviceId);
      }
    }

    return servicesIds;
  }

}
