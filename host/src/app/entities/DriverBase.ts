import EntityBase from './EntityBase';
import EntityDefinition from '../interfaces/EntityDefinition';
import DriverEnv from './DriverEnv';


export default class DriverBase<Props = {}> extends EntityBase<Props> {
  protected readonly env: DriverEnv;

  constructor(definition: EntityDefinition, env: DriverEnv) {
    super(definition, env);
    this.env = env;
  }
}
