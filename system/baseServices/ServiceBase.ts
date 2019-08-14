import EntityBase from '../entities/EntityBase';
import ServiceManifest from '../interfaces/ServiceManifest';


export default class ServiceBase<Props extends {[index: string]: any;} = {}> extends EntityBase<Props> {
  async loadManifest(className: string): Promise<ServiceManifest> {
    return this.context.system.envSet.loadManifest<ServiceManifest>('services', className);
  }
}
