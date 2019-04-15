import EntityBase from '../entities/EntityBase';
import ServiceEnv from './ServiceEnv';
import EntityDefinition from '../interfaces/EntityDefinition';


export default class ServiceBase<Props extends {[index: string]: any;}> extends EntityBase<Props> {
  protected readonly env: ServiceEnv;

  constructor(definition: EntityDefinition, env: ServiceEnv) {
    super(definition, env);
    this.env = env;
  }
}
