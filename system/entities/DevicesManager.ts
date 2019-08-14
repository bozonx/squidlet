import EntityDefinition from '../interfaces/EntityDefinition';
import EntityManagerBase from './EntityManagerBase';
import DeviceBase from '../baseDevice/DeviceBase';


/**
 * Creates instances of local devices and prepare config for them.
 */
export default class DevicesManager extends EntityManagerBase<DeviceBase> {

  /**
   * Initialize all the devices on current host specified by its definitions in config
   */
  async init() {
    const definitions = await this.context.system.envSet.loadConfig<EntityDefinition[]>(
      this.context.system.initializationConfig.fileNames.devicesDefinitions
    );

    for (let definition of definitions) {
      this.instances[definition.id] = await this.makeInstance('devices', definition);
    }

    await this.initializeAll(Object.keys(this.instances));
  }

  getInstantiatedDevicesIds(): string[] {
    return Object.keys(this.instances);
  }

  /**
   * Get device instance.
   * It rises an error if device hasn't found.
   */
  getDevice<T extends DeviceBase>(deviceId: string): T {
    const device: DeviceBase | undefined = this.instances[deviceId];

    if (!device) {
      this.context.log.error(`DevicesManager.getDevice: Can't find the device "${deviceId}"`);
      throw new Error(`Can't find the device "${deviceId}"`);
    }

    return device as T;
  }

}
