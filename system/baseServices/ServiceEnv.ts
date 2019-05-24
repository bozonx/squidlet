import ServiceManifest from '../interfaces/ServiceManifest';
import EnvBase from '../entities/EnvBase';


/**
 * It is environment for devices and services
 */
export default class ServiceEnv extends EnvBase {
  async loadManifest(className: string): Promise<ServiceManifest> {
    return this.system.envSet.loadManifest<ServiceManifest>('services', className);
  }
}
