const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');

import DriverBase from './DriverBase';
import DriverEnv from './DriverEnv';
import EntityDefinition from '../interfaces/EntityDefinition';
import DriverInstance from '../interfaces/DriverInstance';


export type InstanceType = 'alwaysNew' | 'alwaysSame' | 'propName' | 'calc';


/**
 * This factory creates instances and keeps them.
 * After the next request of instance it returns previously created one.
 * Getting/setting instance politics has the next types:
 *   * alwaysNew
 *   * alwaysSame
 *   * propName - you need to set protected property instanceByPropName
 *   * calc - you need to set protected method calcInstanceId which has to return unique instance name
 */
export default abstract class DriverFactoryBase<Instance extends DriverInstance> extends DriverBase {
  protected instances: {[index: string]: Instance} = {};
  protected abstract DriverClass: new (definition: EntityDefinition, env: DriverEnv) => Instance;
  protected instanceType: InstanceType = 'calc';
  // name of instance id in props
  protected instanceByPropName?: string;
  protected calcInstanceId?: (instanceProps: {[index: string]: any}) => string;


  async getInstance(instanceProps: {[index: string]: any} = {}): Promise<Instance> {
    const instanceId: string | undefined = this.getInstanceId(instanceProps);

    if (typeof instanceId === 'undefined') {
      // just create always new instance and don't save
      return await this.makeInstance(instanceProps);
    }

    // return previously saved instance if it is
    if (this.instances[instanceId]) return this.instances[instanceId];
    // create and save instance
    this.instances[instanceId] = await this.makeInstance(instanceProps);
    // return created instance
    return this.instances[instanceId];
  }


  private getInstanceId(instanceProps: {[index: string]: any}): string | undefined {
    if (this.instanceType === 'alwaysNew') {
      return;
    }
    else if (this.instanceType === 'alwaysSame') {
      return 'new';
    }
    else if (this.instanceType === 'propName') {
      if (typeof this.instanceByPropName === 'undefined') throw new Error(`You have to specify "instanceByPropName"`);

      return instanceProps[this.instanceByPropName];
    }
    else if (this.instanceType === 'calc') {
      if (typeof this.calcInstanceId === 'undefined') throw new Error(`You have to specify "calcInstanceId"`);

      return this.calcInstanceId(instanceProps);
    }
    else{
      throw new Error(`Unknown value of "instanceType" property`);
    }
  }

  private async makeInstance(instanceProps: {[index: string]: any}): Promise<Instance> {
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
