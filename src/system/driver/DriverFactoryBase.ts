import {DriverBase} from './DriverBase.js'
import type DriverInstanceBase from './DriverInstanceBase.js'
import type {DriverInstanceParams} from './DriverInstanceBase.js'


// this is used to make instance id
let defaultInstanceIdCounter = 0

// TODO: инстанс должен быть пролойкой. Если его задестроить то сам инстанс не дестроится
//   если его кто-то исползует


/**
 * This factory creates instances of sub drivers and keeps them in the memory.
 * After the next request of instance it returns previously created one.
 * If the "instanceId" method is set then id of instances of subDriver will be calculated there.
 * If there no "instanceId" method then a new instance will be created each call of "subDriver"
 * and never be saved.
 */
export default abstract class DriverFactoryBase<
  Instance extends DriverInstanceBase,
  Props extends Record<string, any> = Record<string, any>
> extends DriverBase {
  // there instances are kept
  protected instances: Record<string, Instance> = {}
  // Specify your sub driver class. It's required.
  protected abstract SubDriverClass: new (DriverInstanceParams: any) => Instance
  protected cfg?: Record<string, any>

  private instanceUses: Record<string, number> = {}


  async init(cfg?: Record<string, any>) {
    this.cfg = cfg
  }

  async destroy() {
    for (const instanceId of Object.keys(this.instances)) {
      await this.destroyInstance(instanceId, true)
    }
  }


  /**
   * Get existent or create a new sub driver instance.
   * It subDriver has an id you shouldn't destroy the subDriver.
   */
  async subDriver(instanceProps: Props = {} as Props): Promise<Instance> {
    // combined instance and definition props
    //const props = mergeDeepObjects(instanceProps, this.definition.props) as Props
    //await this.validateInstanceProps(instanceProps, props)

    const instanceId = this.makeInstanceId(instanceProps, this.cfg)
    // return previously instantiated instance if it exists
    if (this.instances[instanceId]) {
      this.instanceUses[instanceId]++

      return this.instances[instanceId]
    }
    // else create a new instance
    this.instanceUses[instanceId] = 0

    const instanceParams: DriverInstanceParams<Props> = {
      ctx: this.ctx,
      instanceId,
      driver: this,
      props: instanceProps,
      cfg: this.cfg
    }

    const instance = new this.SubDriverClass(instanceParams)

    this.instances[instanceId] = instance

    if (instance.init) await instance.init()
    // return just created instance
    return this.instances[instanceId]
  }

  /**
   * If force then instance will be destroyed any way - do not use it in ordinary way.
   * If not force then instance will be destroyed only if there is no one uses it
   * @param instanceId
   * @param force
   */
  async destroyInstance(instanceId: string, force: boolean = false) {
    if (force || !this.instanceUses[instanceId]) {
      // really destroy an instance
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
  protected makeInstanceId(props: Props, cfg?: Record<string, any>): string {
    return String(defaultInstanceIdCounter++)
  }

}

// private async validateInstanceProps(
//   instanceProps: {[index: string]: any},
//   mergedProps: {[index: string]: any}
// ) {
//   // TODO: а нужно ли повторно загружать манифест, он же должен быть заружен в drivers manager
//   const manifest: EntityManifest = await this.context.system.envSet.loadManifest(
//     'driver',
//     this.definition.id
//   );
//
//   if (!manifest.props) return;
//
//   const validationErr: string | undefined = validateProps(instanceProps, manifest.props)
//     || validateRequiredProps(mergedProps, manifest.props);
//
//   if (validationErr) {
//     throw new Error(`Props of sub driver "${this.definition.id}" are invalid: ${validationErr}`);
//   }
// }
