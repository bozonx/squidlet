import EntityBase from '../app/entities/EntityBase';
import {EntityProps} from '../app/interfaces/EntityDefinition';
import ServiceEnv from '../app/entities/ServiceEnv';
import EntityDefinition from '../app/interfaces/EntityDefinition';


export interface ServiceBaseProps extends EntityProps {
}


export default class ServiceBase<Props extends ServiceBaseProps> extends EntityBase<Props> {
  protected readonly env: ServiceEnv;

  constructor(definition: EntityDefinition, env: ServiceEnv) {
    super(definition, env);
    this.env = env;
  }
}
