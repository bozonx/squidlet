import DriverBase from './DriverBase';

const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');

import DriverEnv from './DriverEnv';
import EntityDefinition, {EntityProps} from '../interfaces/EntityDefinition';


/**
 * This factory creates instances and keeps them.
 * After the next request of instance it returns previously created one.
 */
export default abstract class DriverFactoryBase<Instance, Props extends EntityProps> extends DriverBase<Props> {
  protected instances: {[index: string]: Instance} = {};
  // name of instance id in props
  protected abstract instanceIdName: string;
  protected abstract DriverClass: new (definition: EntityDefinition, env: DriverEnv) => Instance;


  getInstance(additionalProps?: Props): Instance {
    if (this.instances[this.instanceIdName]) return this.instances[this.instanceIdName];

    const definition = {
      ...this.definition,
      props: _defaultsDeep(_cloneDeep(additionalProps), this.definition.props),
    };

    this.instances[this.instanceIdName] = new this.DriverClass(definition, this.env);

    return this.instances[this.instanceIdName];
  }

}
