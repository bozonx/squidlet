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
  protected abstract DriverClass: new (definition: EntityDefinition, env: DriverEnv) => Instance;
  // name of instance id in props
  protected instanceIdName?: string;
  protected combinedInstanceIdName?: (instanceProps?: {[index: string]: any}) => string;


  getInstance(instanceProps?: Props): Instance {
    if (!this.instanceIdName && !this.combinedInstanceIdName) {
      throw new Error(`You have to specify at least "instanceIdName" or "combinedInstanceIdName()"`);
    }
    
    const instanceIdName: string = this.instanceIdName || (this.combinedInstanceIdName as any)(instanceProps);
    
    if (this.instances[instanceIdName]) return this.instances[instanceIdName];

    const definition = {
      ...this.definition,
      props: _defaultsDeep(_cloneDeep(instanceProps), this.definition.props),
    };

    this.instances[instanceIdName] = new this.DriverClass(definition, this.env);

    return this.instances[instanceIdName];
  }

}
