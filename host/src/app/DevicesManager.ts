import System from './System';
import DeviceInstance from './interfaces/DeviceInstance';
import DeviceManifest from './interfaces/DeviceManifest';
import EntityDefinition, {EntityProps} from './interfaces/EntityDefinition';
import Env from './Env';


type DeviceClassType = new (props: EntityProps, env: Env) => DeviceInstance;


/**
 * Creates instances of local devices and prepare config for them.
 */
export default class DevicesManager {
  private readonly system: System;
  // devices instances by ids
  private readonly instances: {[index: string]: DeviceInstance} = {};

  constructor(system: System) {
    this.system = system;
  }

  /**
   * Initialize all the devices on current host specified by its definitions in config
   */
  async init(): Promise<void> {
    const definitions = await this.system.loadConfig<EntityDefinition[]>(
      this.system.initCfg.fileNames.devicesDefinitions
    );

    // it's need to load one manifest file for group of devices which are used it
    const groupedByManifests: {[index: string]: EntityDefinition[]} = this.groupDevicesDefinitionsByClass(definitions);

    for (let className of Object.keys(groupedByManifests)) {
      const manifest = await this.system.loadManifest<DeviceManifest>(
        this.system.initCfg.hostDirs.devices,
        className,
      );

      // each definition of manifest
      for (let definition of groupedByManifests[className]) {
        this.instances[definition.id] = await this.instantiateDevice(definition, manifest);
      }
    }

    await this.initializeAll();
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


  private async initializeAll() {
    for (let driverId of Object.keys(this.instances)) {
      const device: DeviceInstance = this.instances[driverId];

      await device.init();
    }
  }

  private groupDevicesDefinitionsByClass(
    definitions: EntityDefinition[]
  ): {[index: string]: EntityDefinition[]} {
    const result: {[index: string]: EntityDefinition[]} = {};

    for (let definition of definitions) {
      const {className} = definition;

      if (!result[className]) result[className] = [];

      result[className].push(definition);
    }

    return result;
  }

  private async instantiateDevice (
    definition: EntityDefinition,
    manifest: DeviceManifest
  ): Promise<DeviceInstance> {
    const DeviceClass = await this.system.loadEntityClass<DeviceClassType>(
      this.system.initCfg.hostDirs.devices,
      definition.id
    );
    // TODO: remake
    const props: EntityProps = {
      // TODO: definition тоже имеет props
      ...definition,
      manifest,
    };

    return new DeviceClass(this.system.env, props);
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
