import {mergeDeepObjects} from 'squidlet-lib/src/objects'

import {validateProps, validateRequiredProps} from '../../../__old/system/lib/validate'
import Context from '../system/Context'
import EntityBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/EntityBase.js'
import DriverInstanceBase, {DriverInstanceParams} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverInstanceBase.js'
import EntityManifest from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityManifest.js'


let defaultInstanceIdCounter = 0


/**
 * This factory creates instances of sub drivers and keeps them in the memory.
 * After the next request of instance it returns previously created one.
 * If the "instanceId" method is set then id of instances of subDriver will be calculated there.
 * If there no "instanceId" method then a new instance will be created each call of "subDriver"
 * and never be saved.
 */
export default abstract class DriverFactoryBase<
  Props = Record<string, any>,
  Instance extends DriverInstanceBase = any
> extends EntityBase {
  // there instances are kept
  protected instances: Record<string, Instance> = {}
  // Specify your sub driver class. It's required.
  protected abstract SubDriverClass: new (
    context: Context,
    params: any
  ) => Instance

  private instanceUses: Record<string, number> = {}


  destroy = async () => {
    for (const instanceId of Object.keys(this.instances)) {
      await this.destroyInstance(instanceId, true)
    }
  }


  /**
   * Get existent or create a new sub driver instance.
   * It subDriver has an id you shouldn't destroy the subDriver.
   */
  async subDriver(
    instanceProps: Record<string, any> = {}
  ): Promise<Instance> {
    // combined instance and definition props
    const props = mergeDeepObjects(instanceProps, this.definition.props) as Props

    await this.validateInstanceProps(instanceProps, props)

    const instanceId = this.makeInstanceId(props)
    // return previously instantiated instance if it exists
    if (this.instances[instanceId]) {
      this.instanceUses[instanceId]++

      return this.instances[instanceId]
    }
    // else create a new instance
    this.instanceUses[instanceId] = 0

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

  async destroyInstance(instanceId: string, force: boolean = false) {
    if (force || !this.instanceUses[instanceId]) {
      const instance = this.instances[instanceId]

      if (instance.$doDestroy) await instance.$doDestroy()

      delete this.instances[instanceId]
      delete this.instanceUses[instanceId]

      return
    }
    // decrement uses of instance
    this.instanceUses[instanceId]--
  }

  // Specify it to calculate an id of the new instance of sub driver
  protected makeInstanceId(props: Props): string {
    return String(defaultInstanceIdCounter++)
  }


  private async validateInstanceProps(
    instanceProps: {[index: string]: any},
    mergedProps: {[index: string]: any}
  ) {
    // TODO: а нужно ли повторно загружать манифест, он же должен быть заружен в drivers manager
    const manifest: EntityManifest = await this.context.system.envSet.loadManifest(
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
