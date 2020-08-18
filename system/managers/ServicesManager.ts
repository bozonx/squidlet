import EntityDefinition from '../interfaces/EntityDefinition';
import EntityManagerBase from './EntityManagerBase';
import ServiceBase from '../base/ServiceBase';
import systemConfig from '../systemConfig';
import {EntityType} from '../interfaces/EntityTypes';


export interface ServicesObj {

}


export default class ServicesManager extends EntityManagerBase<ServiceBase> {
  service: ServicesObj = {};

  protected entityType: EntityType = 'service';


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
      this.instances[serviceId] = await this.makeInstance(definitions[serviceId]);
    }
  }

  getService<T extends ServiceBase>(serviceId: string): T {
    if (!this.instances[serviceId]) throw new Error(`Can't find the service "${serviceId}"`);

    return this.instances[serviceId] as T;
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
