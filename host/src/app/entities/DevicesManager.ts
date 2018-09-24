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
    const definitions = await this.system.configSet.loadConfig<EntityDefinition[]>(
      this.system.initCfg.fileNames.devicesDefinitions
    );

    for (let definition of definitions) {
      this.instances[definition.id] = await this.makeInstance(definition);
    }

    await this.initializeAll(Object.keys(this.instances));
  }

  /**
   * Get device instance
   */
  getDevice<T extends DeviceInstance>(deviceId: string): T {
    const device: DeviceInstance | undefined = this.instances[deviceId];

    // TODO: эта ошибка в рантайме нужно залогировать ее но не вызывать исключение, либо делать try везде
    if (!device) throw new Error(`Can't find device "${deviceId}"`);

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
