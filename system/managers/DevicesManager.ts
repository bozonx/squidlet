import EntityDefinition from '../interfaces/EntityDefinition';
import EntityManagerBase from './EntityManagerBase';
import DeviceBase from '../base/DeviceBase';
import systemConfig from '../systemConfig';


/**
 * Creates instances of local devices and prepare config for them.
 */
export default class DevicesManager extends EntityManagerBase<DeviceBase> {
  /**
   * Initialize all the devices on current host specified by its definitions in config
   */
  async instantiate() {
    const definitions = await this.context.system.envSet.loadConfig<EntityDefinition[]>(
      systemConfig.fileNames.devicesDefinitions
    );

    for (let definition of definitions) {
      this.instances[definition.id] = await this.makeInstance('device', definition);
    }
  }

  /**
   * Call init() method of all the devices
   */
  async initialize() {
    this.context.log.debug(`DevicesManager: instantiating device "${definition.id}"`);
    // TODO: add initializeAll
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
