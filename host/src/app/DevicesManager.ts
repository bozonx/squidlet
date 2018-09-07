import System from './System';
import DeviceInstance from './interfaces/DeviceInstance';
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
    const definitions = await this.system.host.loadConfig<EntityDefinition[]>(
      this.system.initCfg.fileNames.devicesDefinitions
    );

    for (let definition of definitions) {
      this.instances[definition.id] = await this.makeInstance(definition);
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

  private async makeInstance (definition: EntityDefinition): Promise<DeviceInstance> {
    const DeviceClass = await this.system.host.loadEntityClass<DeviceClassType>(
      this.system.initCfg.hostDirs.devices,
      definition.id
    );

    return new DeviceClass(definition.props, this.system.env);
  }

  private async initializeAll() {
    for (let deviceId of Object.keys(this.instances)) {
      const device: DeviceInstance = this.instances[deviceId];

      await device.init();
    }
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


// private groupDevicesDefinitionsByClass(
//   definitions: EntityDefinition[]
// ): {[index: string]: EntityDefinition[]} {
//   const result: {[index: string]: EntityDefinition[]} = {};
//
//   for (let definition of definitions) {
//     const {className} = definition;
//
//     if (!result[className]) result[className] = [];
//
//     result[className].push(definition);
//   }
//
//   return result;
// }

// // it's need to load one manifest file for group of devices which are used it
// const groupedByManifests: {[index: string]: EntityDefinition[]} = this.groupDevicesDefinitionsByClass(definitions);
//
// for (let className of Object.keys(groupedByManifests)) {
//   const manifest = await this.system.host.loadManifest<DeviceManifest>(
//     this.system.initCfg.hostDirs.devices,
//     className,
//   );
//
//   // each definition of manifest
//   for (let definition of groupedByManifests[className]) {
//     this.instances[definition.id] = await this.instantiateDevice(definition);
//   }
// }
