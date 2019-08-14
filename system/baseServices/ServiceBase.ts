import EntityBase from '../entities/EntityBase';
import EntityDefinition from '../interfaces/EntityDefinition';
import ServiceManifest from '../interfaces/ServiceManifest';
import EntityEnv from '../entities/EntityEnv';


export default class ServiceBase<Props extends {[index: string]: any;} = {}> extends EntityBase<Props> {
  protected readonly env: EntityEnv;

  constructor(definition: EntityDefinition, env: EntityEnv) {
    super(definition, env);
    this.env = env;
  }


  async loadManifest(className: string): Promise<ServiceManifest> {
    return this.system.envSet.loadManifest<ServiceManifest>('services', className);
  }
}
