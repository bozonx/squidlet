import EntityDefinition from '../interfaces/EntityDefinition';
import DriverManifest from '../interfaces/DriverManifest';
import DriverBase from './DriverBase';
import {validateProps, validateRequiredProps} from '../lib/validate';
import {mergeDeepObjects} from '../lib/objects';
import Context from '../Context';


/**
 * This factory creates instances of sub drivers and keeps them in the memory.
 * After the next request of instance it returns previously created one.
 * If the "instanceId" method is set then id of instances of subDriver will be calculated there.
 * If there no "instanceId" method then a new instance will be created each call of "subDriver"
 * and never be saved.
 */
export default abstract class DriverFactoryBase<
  Instance extends DriverBase = DriverBase,
  Props = {[index: string]: any}
> extends DriverBase {
  // there instances are kept
  protected instances: {[index: string]: Instance} = {};
  // Specify your sub driver class. It's required.
  protected abstract SubDriverClass: new (context: Context, definition: EntityDefinition) => Instance;
  // Specify it to calculate an id of the new instance of sub driver
  protected instanceId?: (props: Props) => string;


  destroy = async () => {
    for (let name of Object.keys(this.instances)) {
      const instance: Instance = this.instances[name];

      if (instance.destroy) await instance.destroy();
    }
  }


  /**
   * Get existent or create a new sub driver instance
   */
  async subDriver(instanceProps: {[index: string]: any} = {}): Promise<Instance> {
    // combined instance and definition props
    const props = mergeDeepObjects(instanceProps, this.definition.props) as Props;
    const instanceId: string | undefined = this.getInstanceId(props);

    // TODO: лучше не ждать до создания инстанса
    await this.validateInstanceProps(instanceProps, props);

    if (typeof instanceId === 'undefined') {
      // just create a new instance and don't save it
      return this.makeInstance(props);
    }

    // else in case if specified any id includes the same id each time
    // return previously instantiated instance if it is
    if (this.instances[instanceId]) {
      return this.instances[instanceId];
    }

    // create and save instance
    this.instances[instanceId] = await this.makeInstance(props);
    // return just created instance
    return this.instances[instanceId];
  }


  private getInstanceId(props: Props): string | undefined {
    if (!this.instanceId) return;

    if (typeof this.instanceId !== 'function') {
      throw new Error(`You have to specify "instanceIdCalc"`);
    }

    return this.instanceId(props);
  }

  private async makeInstance(props: Props): Promise<Instance> {
    // replace merged props
    const definition = {
      ...this.definition,
      props,
    };

    const instance: Instance = new this.DriverClass(this.context, definition);

    // TODO: нужно ли сразу инициализировать ???
    // init it right now
    if (instance.init) await instance.init();

    return instance;
  }

  // TODO: review
  private async validateInstanceProps(
    instanceProps: {[index: string]: any},
    mergedProps: {[index: string]: any}
  ) {
    const manifest: DriverManifest = await this.context.system.envSet.loadManifest(
      'driver',
      this.definition.id
    );

    if (!manifest.props) return;

    const validationErr: string | undefined = validateProps(instanceProps, manifest.props)
      || validateRequiredProps(mergedProps, manifest.props);

    if (validationErr) {
      throw new Error(`Can't make instance of driver "${this.definition.id}": ${validationErr}`);
    }
  }

}
