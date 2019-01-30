import EntityBase from '../EntityBase';
import {EntityProps} from '../../interfaces/EntityDefinition';
import ServiceEnv from '../../entities/ServiceEnv';
import EntityDefinition from '../../interfaces/EntityDefinition';


export interface ServiceBaseProps extends EntityProps {
}


export default class ServiceBase<Props extends ServiceBaseProps> extends EntityBase<Props> {
  protected readonly env: ServiceEnv;

  constructor(definition: EntityDefinition, env: ServiceEnv) {
    super(definition, env);
    this.env = env;
  }
}
