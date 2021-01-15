import {mergeDeepObjects} from 'squidlet-lib/src/objects';

import DriverManifest from '../../__old/system/interfaces/DriverManifest';
import {validateProps, validateRequiredProps} from '../../__old/system/lib/validate';
import Context from '../system/Context';
import EntityBase from './EntityBase'
import DriverInstanceBase, {DriverInstanceParams} from './DriverInstanceBase'


/**
 * This factory creates instances of sub drivers and keeps them in the memory.
 * After the next request of instance it returns previously created one.
 * If the "instanceId" method is set then id of instances of subDriver will be calculated there.
 * If there no "instanceId" method then a new instance will be created each call of "subDriver"
 * and never be saved.
 */
export default abstract class DriverFactoryBase<
  Props = Record<string, any>
> extends EntityBase {
  // there instances are kept
  protected instances: Record<string, DriverInstanceBase<Props>> = {}
  // Specify your sub driver class. It's required.
  protected abstract SubDriverClass: new (
    context: Context,
    params: DriverInstanceParams<Props>
  ) => DriverInstanceBase<Props>


  destroy = async () => {
    for (let name of Object.keys(this.instances)) {
      const instance = this.instances[name]

      if (instance.$doDestroy) await instance.$doDestroy()
    }
  }


  /**
   * Get existent or create a new sub driver instance.
   * It subDriver has an id you shouldn't destroy the subDriver.
   */
  async subDriver(
    instanceProps: Record<string, any> = {}
  ): Promise<DriverInstanceBase<Props>> {
    // combined instance and definition props
    const props = mergeDeepObjects(instanceProps, this.definition.props) as Props

    await this.validateInstanceProps(instanceProps, props)

    const instanceId = this.makeInstanceId(props)
    // return previously instantiated instance if it exists
    if (this.instances[instanceId]) return this.instances[instanceId]

    const instanceParams: DriverInstanceParams<Props> = {
      instanceId,
      props,
      driver: this,
    }

    const instance = new this.SubDriverClass(this.context, instanceParams)

    this.instances[instanceId] = instance

    if (instance.init) await instance.init()

    // return just created instance
    return this.instances[instanceId]
  }

  destroyInstance(instanceId: string | number) {
    // TODO: add
  }

  // Specify it to calculate an id of the new instance of sub driver
  protected makeInstanceId(props: Props): string {

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
