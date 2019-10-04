import EntityDefinition from '../interfaces/EntityDefinition';
import EntityManagerBase from './EntityManagerBase';
import ServiceBase from '../base/ServiceBase';
import systemConfig from '../systemConfig';


export default class ServicesManager extends EntityManagerBase<ServiceBase> {
  /**
   * Instantiate all the services
   */
  async instantiate() {
    const orderedServicesList: string[] = await this.context.system.envSet.loadConfig<string[]>(
      systemConfig.fileNames.servicesList
    );
    const definitions = await this.context.system.envSet.loadConfig<{[index: string]: EntityDefinition}>(
      systemConfig.fileNames.servicesDefinitions
    );
    const servicesIds: string[] = await this.generateServiceIdsList(orderedServicesList, definitions);

    for (let serviceId of servicesIds) {
      this.instances[serviceId] = await this.makeInstance('service', definitions[serviceId]);
    }
  }

  /**
   * Call init() method of all the services
   */
  async initialize() {
    this.context.log.debug(`ServicesManager: instantiating service "${serviceId}"`);
    // TODO: add initializeAll
  }

  getService<T extends ServiceBase>(serviceId: string): T {
    const service: ServiceBase | undefined = this.instances[serviceId];

    if (!service) throw new Error(`Can't find the service "${serviceId}"`);

    return service as T;
  }

  // TODO: похоже здесь переводятся id в classNames
  private generateServiceIdsList(
    orderedServicesList: string[],
    definitions: {[index: string]: EntityDefinition}
  ): string[] {
    const servicesIds: string[] = [];

    for (let serviceId of Object.keys(definitions)) {
      if (orderedServicesList.includes(definitions[serviceId].className)) {
        servicesIds.push(serviceId);
      }
    }

    return servicesIds;
  }

}
