const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');

import DriverBase from './DriverBase';
import DriverEnv from './DriverEnv';
import EntityDefinition, {EntityProps} from '../interfaces/EntityDefinition';
import DriverInstance from '../interfaces/DriverInstance';


type InstanceType = 'alwaysNew' | 'alwaysSame' | 'propName' | 'calc';


/**
 * This factory creates instances and keeps them.
 * After the next request of instance it returns previously created one.
 * Getting/setting instance politics has the next types:
 *   * alwaysNew
 *   * alwaysSame
 *   * propName - you need to set protected property instanceByPropName
 *   * calc - you need to set protected method which has to return unique instance name
 */
export default abstract class DriverFactoryBase<Instance extends DriverInstance, Props extends EntityProps> extends DriverBase<Props> {
  protected instances: {[index: string]: Instance} = {};
  protected abstract DriverClass: new (definition: EntityDefinition, env: DriverEnv) => Instance;
  // name of instance id in props
  protected instanceIdName?: string;
  protected combinedInstanceIdName?: (instanceProps?: {[index: string]: any}) => string;


  async getInstance(instanceProps?: Props): Promise<Instance> {
    if (!this.instanceIdName && !this.combinedInstanceIdName) {
      throw new Error(`You have to specify at least "instanceIdName" or "combinedInstanceIdName()"`);
    }
    
    const instanceIdName: string = this.instanceIdName || (this.combinedInstanceIdName as any)(instanceProps);
    const instanceId = (instanceProps) ? instanceProps[instanceIdName] : 'default';

    if (this.instances[instanceId]) return this.instances[instanceId];

    const definition = {
      ...this.definition,
      props: _defaultsDeep(_cloneDeep(instanceProps), this.definition.props),
    };

    this.instances[instanceId] = new this.DriverClass(definition, this.env);

    if (this.instances[instanceId].init) await (this.instances[instanceId].init as any)();

    return this.instances[instanceId];
  }

}
