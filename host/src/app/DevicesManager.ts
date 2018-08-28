import * as path from 'path';

import System from './System';
import DeviceInstance from './interfaces/DeviceInstance';
import DeviceManifest from './interfaces/DeviceManifest';
import DeviceDefinition from './interfaces/DeviceDefinition';
import DeviceProps from './interfaces/DeviceProps';


type DeviceClassType = new (system: System, props: DeviceProps) => DeviceInstance;


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
    const definitionsJsonFile = path.join(
      this.system.initCfg.rootDirs.host,
      this.system.initCfg.hostDirs.config,
      this.system.initCfg.fileNames.devicesDefinitions
    );
    const definitions: DeviceDefinition[] = await this.system.loadJson(definitionsJsonFile);
    // it's need to load one manifest file for group of devices which are used it
    const groupedByManifests: {[index: string]: DeviceDefinition[]} = this.groupDevicesDefinitionsByClass(definitions);

    for (let className of Object.keys(groupedByManifests)) {
      const manifestPath = path.join(
        this.system.initCfg.rootDirs.host,
        this.system.initCfg.hostDirs.devices,
        className,
        this.system.initCfg.fileNames.manifest
      );
      const manifest: DeviceManifest = await this.system.loadJson(manifestPath);

      // each definition of manifest
      for (let definition of groupedByManifests[className]) {
        this.instances[definition.id] = await this.instantiateDevice(definition, manifest);
      }
    }

    // initialize
    for (let driverId of Object.keys(this.instances)) {
      const device: DeviceInstance = this.instances[driverId];

      await device.init();
    }
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


  private groupDevicesDefinitionsByClass(
    definitions: DeviceDefinition[]
  ): {[index: string]: DeviceDefinition[]} {
    const result: {[index: string]: DeviceDefinition[]} = {};

    for (let definition of definitions) {
      const {className} = definition;

      if (!result[className]) result[className] = [];

      result[className].push(definition);
    }

    return result;
  }

  private async instantiateDevice (
    definition: DeviceDefinition,
    manifest: DeviceManifest
  ): Promise<DeviceInstance> {
    const props: DeviceProps = {
      // TODO: definition тоже имеет props
      ...definition,
      manifest,
    };
    const deviceDir = path.join(this.system.initCfg.rootDirs.host, this.system.initCfg.hostDirs.devices, definition.id);
    // TODO: !!!! переделать - наверное просто загружать main.js
    const mainFilePath = path.resolve(deviceDir, manifest.main);
    const DeviceClass: DeviceClassType = this.system.require(mainFilePath).default;

    return new DeviceClass(this.system, props);
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
