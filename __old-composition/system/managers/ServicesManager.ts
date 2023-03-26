import EntityDefinition from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityDefinition.js';
import EntityManagerBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/managers/EntityManagerBase.js';
import ServiceBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/ServiceBase.js';
import systemConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/systemConfig.js';
import {EntityType} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityTypes.js';
import ServicesObj from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/ServicesObj.js';


export default class ServicesManager extends EntityManagerBase<ServiceBase> {
  // shortcut to faster access
  get service(): ServicesObj {
    return this.instances as any;
  }

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
