import DriverBase from './DriverBase';
import DriverEnv from './DriverEnv';
import EntityDefinition from '../interfaces/EntityDefinition';
import DriverInstance from '../interfaces/DriverInstance';
import {cloneDeep, defaultsDeep} from '../../helpers/lodashLike';


/**
 * This factory creates instances and keeps them in memory if they will be reused.
 * After the next request of instance it returns previously created one.
 * Getting/setting instance politics has the next types:
 * * if instanceAlwaysSame is set method getInstance will return the same instance all the time
 * * if instanceByPropName is set method getInstance will return instances by unique id which
 *   gets from props. E.g instanceByPropName = 'pin' and props is {pin: 1} then
 *   "1" is unique id for instances
 * * if instanceIdCalc is set method getInstance will call this function to get unique id
 */
export default abstract class DriverFactoryBase<Instance extends DriverInstance> extends DriverBase {
  protected instances: {[index: string]: Instance} = {};
  protected abstract DriverClass: new (definition: EntityDefinition, env: DriverEnv) => Instance;
  protected instanceAlwaysNew: boolean = false;
  protected instanceAlwaysSame: boolean = false;
  // name of instance id in props
  protected instanceByPropName?: string;
  // calculate instance id by calling a function
  protected instanceIdCalc?: (props: {[index: string]: any}) => string;


  async getInstance(instanceProps: {[index: string]: any} = {}): Promise<Instance> {
    // combined instance and definition props
    const props: {[index: string]: any} = defaultsDeep(cloneDeep(instanceProps), this.definition.props);
    const instanceId: string | undefined = this.getInstanceId(props);

    if (typeof instanceId === 'undefined') {
      // just create always new instance and don't save
      return await this.makeInstance(props);
    }

    // return previously saved instance if it is
    if (this.instances[instanceId]) return this.instances[instanceId];
    // create and save instance
    this.instances[instanceId] = await this.makeInstance(props);
    // return created instance
    return this.instances[instanceId];
  }


  private getInstanceId(props: {[index: string]: any}): string | undefined {
    if (this.instanceAlwaysNew) {
      // undefined means always new instance
      return;
    }
    if (this.instanceAlwaysSame) {
      return 'same';
    }
    else if (this.instanceByPropName) {
      if (typeof this.instanceByPropName === 'undefined') throw new Error(`You have to specify "instanceByPropName"`);

      return props[this.instanceByPropName];
    }
    else if (this.instanceIdCalc) {
      if (typeof this.instanceIdCalc !== 'function') {
        throw new Error(`You have to specify "instanceIdCalc"`);
      }

      return this.instanceIdCalc(props);
    }

    throw new Error(`DriverFactoryBase: cant resolve getting instance method! $`);
  }

  private async makeInstance(props: {[index: string]: any}): Promise<Instance> {
    const definition = {
      ...this.definition,
      props,
    };

    const instance: Instance = new this.DriverClass(definition, this.env);

    // init it
    if (instance.init) await instance.init();

    return instance;
  }

}
