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
    const systemServicesList = await this.system.configSet.loadConfig<string[]>(
      this.system.initCfg.fileNames.systemServices
    );

    await this.initServices(systemServicesList);
  }

  async initRegularServices() {
    const regularServicesList = await this.system.configSet.loadConfig<string[]>(
      this.system.initCfg.fileNames.regularServices
    );

    await this.initServices(regularServicesList);
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
