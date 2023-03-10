import EntityDefinition from '../interfaces/EntityDefinition';
import EntityManagerBase from './EntityManagerBase';
import DeviceBase from '../base/DeviceBase';
import systemConfig from '../systemConfig';
import {EntityType} from '../interfaces/EntityTypes';


/**
 * Creates instances of local devices and prepare config for them.
 */
export default class DevicesManager extends EntityManagerBase<DeviceBase> {
  protected entityType: EntityType = 'device';


  /**
   * Initialize all the devices on current host specified by its definitions in config
   */
  async instantiate() {
    const definitions = await this.context.system.envSet.loadConfig<EntityDefinition[]>(
      systemConfig.fileNames.devicesDefinitions
    );

    for (let definition of definitions) {
      this.instances[definition.id] = await this.makeInstance(definition);
    }
  }

  /**
   * Get device instance.
   * It rises an error if device hasn't found.
   */
  getDevice<T extends DeviceBase>(deviceId: string): T {
    if (!this.instances[deviceId]) throw new Error(`Can't find the device "${deviceId}"`);

    return this.instances[deviceId] as T;
  }

}
