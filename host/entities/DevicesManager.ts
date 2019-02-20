import DeviceInstance from '../interfaces/DeviceInstance';
import EntityDefinition from '../interfaces/EntityDefinition';
import DeviceEnv from './DeviceEnv';
import EntityManagerBase from './EntityManagerBase';
import System from '../System';


/**
 * Creates instances of local devices and prepare config for them.
 */
export default class DevicesManager extends EntityManagerBase<DeviceInstance, DeviceEnv> {
  constructor(system: System) {
    super(system, DeviceEnv);
  }

  /**
   * Initialize all the devices on current host specified by its definitions in config
   */
  async init() {
    const definitions = await this.system.envSet.loadConfig<EntityDefinition[]>(
      this.system.initCfg.fileNames.devicesDefinitions
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
  getDevice<T extends DeviceInstance>(deviceId: string): T {
    const device: DeviceInstance | undefined = this.instances[deviceId];

    if (!device) {
      this.env.log.error(`DevicesManager.getDevice: Can't find the device "${deviceId}"`);
      throw new Error(`Can't find the device "${deviceId}"`);
    }

    return device as T;
  }

  destroy() {

    // TODO: make
    // TODO: use async
    // TODO: событие поднять в App

    // // run destroy of devices instances
    // _.each(this._devicesInstances, (device) => {
    //   device.destroy && device.destroy();
    // });
    //
    // this._app.events.emit(`app.afterDestroy`);
  }

}
