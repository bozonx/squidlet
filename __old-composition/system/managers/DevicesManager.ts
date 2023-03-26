import EntityDefinition from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityDefinition.js';
import EntityManagerBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/managers/EntityManagerBase.js';
import DeviceBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/base/DeviceBase.js';
import systemConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/systemConfig.js';
import {EntityType} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityTypes.js';


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
