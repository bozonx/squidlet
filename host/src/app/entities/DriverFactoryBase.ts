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
 *   * calc - you need to set protected method calcInstanceId which has to return unique instance name
 */
export default abstract class DriverFactoryBase<Instance extends DriverInstance, Props extends EntityProps> extends DriverBase<Props> {
  protected instances: {[index: string]: Instance} = {};
  protected abstract DriverClass: new (definition: EntityDefinition, env: DriverEnv) => Instance;
  protected abstract instanceType: InstanceType = 'propName';
  // name of instance id in props
  protected instanceByPropName?: string;
  protected calcInstanceId?: (instanceProps?: {[index: string]: any}) => string;


  async getInstance(instanceProps?: Props): Promise<Instance> {
    const instanceId: string | undefined = this.getInstanceId();

    if (typeof instanceId === 'undefined') {
      // just create always new instance and don't save
      return await this.makeInstance();
    }

    // return previously saved instance if it is
    if (this.instances[instanceId]) return this.instances[instanceId];
    // create and save instance
    this.instances[instanceId] = await this.makeInstance();
    // return created instance
    return this.instances[instanceId];
  }

  private getInstanceId(): string | undefined {
    if (this.instanceType === 'propName' && !this.instanceByPropName) {
      throw new Error(`You have to specify "instanceByPropName"`);
    }
    else if (this.instanceType === 'propName' && !this.calcInstanceId) {
      throw new Error(`You have to specify "calcInstanceId"`);
    }

    const instanceIdName: string = this.instanceIdName || (this.combinedInstanceIdName as any)(instanceProps);
    const instanceId = (instanceProps) ? instanceProps[instanceIdName] : 'default';
  }

  private async makeInstance(): Promise<Instance> {
    const definition = {
      ...this.definition,
      props: _defaultsDeep(_cloneDeep(instanceProps), this.definition.props),
    };

    const instance: Instance = new this.DriverClass(definition, this.env);

    // init it
    if (instance.init) await instance.init();

    return instance;
  }

}
