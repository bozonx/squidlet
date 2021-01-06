import EntityDefinition from '../interfaces/EntityDefinition';
import DriverManifest from '../interfaces/DriverManifest';
import DriverBase from '../../../src/base/DriverBase';
import {validateProps, validateRequiredProps} from '../lib/validate';
import {mergeDeepObjects} from '../../../../squidlet-lib/src/objects';
import Context from '../../../src/system/Context';


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
   * Get existent or create a new sub driver instance.
   * It subDriver has an id you shouldn't destroy the subDriver.
   */
  async subDriver(instanceProps: {[index: string]: any} = {}): Promise<Instance> {
    // combined instance and definition props
    const props = mergeDeepObjects(instanceProps, this.definition.props) as Props;

    await this.validateInstanceProps(instanceProps, props);

    // just create a new instance and don't save it
    if (!this.instanceId) return this.makeInstance(props);

    const instanceId: string | undefined = this.instanceId(props);

    if (typeof instanceId !== 'string') throw new Error(`instanceId() method has to return a string`);

    // else in case if specified any id includes the same id each time
    // return previously instantiated instance if it is
    if (this.instances[instanceId]) return this.instances[instanceId];

    // create and save instance
    this.instances[instanceId] = await this.makeInstance(props);
    // return just created instance
    return this.instances[instanceId];
  }


  private async makeInstance(props: Props): Promise<Instance> {
    // make a definition where preps are merged props of definition's and instance's
    const definition = {
      ...this.definition,
      props,
    };

    const instance: Instance = new this.SubDriverClass(this.context, definition);

    // init it right now
    if (instance.init) await instance.init();

    return instance;
  }

  private async validateInstanceProps(
    instanceProps: {[index: string]: any},
    mergedProps: {[index: string]: any}
  ) {
    // TODO: а нужно ли повторно загружать манифест, он же должен быть заружен в drivers manager
    const manifest: DriverManifest = await this.context.system.envSet.loadManifest(
      'driver',
      this.definition.id
    );

    if (!manifest.props) return;

    const validationErr: string | undefined = validateProps(instanceProps, manifest.props)
      || validateRequiredProps(mergedProps, manifest.props);

    if (validationErr) {
      throw new Error(`Props of sub driver "${this.definition.id}" are invalid: ${validationErr}`);
    }
  }

}
