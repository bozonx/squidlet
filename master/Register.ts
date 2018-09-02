const _values = require('lodash/values');
import * as path from 'path';

import PreDeviceManifest from './interfaces/PreDeviceManifest';
import PreDriverManifest from './interfaces/PreDriverManifest';
import PreServiceManifest from './interfaces/PreServiceManifest';
import validateServiceManifest from './validateServiceManifest';
import validateDeviceManifest from './validateDeviceManifest';
import validateDriverManifest from './validateDriverManifest';
import {Map} from 'immutable';
import Plugin from './interfaces/Plugin';
import PluginEnv from './PluginEnv';
import PreManifestBase from './interfaces/PreManifestBase';
import Main from './Main';
import {ManifestsTypeName, ManifestsTypePluralName} from './Manifests';


/**
 * Register a new type of device, driver or service
 */
export default class Register {
  private readonly main: Main;
  private readonly plugins: Plugin[] = [];
  // devices manifest by manifest name
  private devices: Map<string, PreDeviceManifest> = Map<string, PreDeviceManifest>();
  // drivers manifest by manifest name
  private drivers: Map<string, PreDriverManifest> = Map<string, PreDriverManifest>();
  // services manifest by manifest name
  private services: Map<string, PreServiceManifest> = Map<string, PreServiceManifest>();
  private readonly registeringPromises: Promise<any>[] = [];


  constructor(main: Main) {
    this.main = main;
  }

  getDevicesPreManifests(): PreDeviceManifest[] {
    return _values(this.devices.toJS());
  }

  getDriversPreManifests(): PreDriverManifest[] {
    return _values(this.drivers.toJS());
  }

  getServicesPreManifests(): PreServiceManifest[] {
    return _values(this.services.toJS());
  }

  getRegisteringPromises(): Promise<any>[] {
    return this.registeringPromises;
  }

  addPlugin(plugin: string | Plugin) {
    if (typeof plugin === 'string') {
      // it's path to plugin - let's load it
      if (!path.isAbsolute(plugin)) {
        throw new Error(`You have to specify an absolute path of "${plugin}"`);
      }

      const pluginFunction: Plugin = this.main.$require(plugin);

      this.plugins.push(pluginFunction);
    }
    else if (typeof plugin === 'function') {
      // it's a function - just add it
      this.plugins.push(plugin);
    }
    else {
      throw new Error(`Incorrect type of plugin "${JSON.stringify(plugin)}"`);
    }
  }

  /**
   * Add new device to the system.
   * @param manifest - it can be path to manifest yaml file or js plain object
   */
  async addDevice(manifest: string | PreDeviceManifest) {
    return this.addEntity<PreDeviceManifest>('device', manifest);
  }

  /**
   * Add new driver to the system.
   * @param manifest - it can be path to manifest yaml file or js plain object
   */
  async addDriver(manifest: string | PreDriverManifest) {
    return this.addEntity<PreDriverManifest>('driver', manifest);
 }

  /**
   * Add new service to the system.
   * @param manifest - it can be path to manifest yaml file or js plain object
   */
  async addService(manifest: string | PreServiceManifest) {
    return this.addEntity<PreServiceManifest>('service', manifest);
  }

  async initPlugins(pluginEnv: PluginEnv) {
    for (let plugin of this.plugins) {
      await plugin(pluginEnv);
    }
  }


  private async addEntity<T extends PreManifestBase>(manifestType: ManifestsTypeName, manifest: string | T) {
    const resolvePromise: Promise<T> = this.resolveManifest<T>(manifest);

    this.registeringPromises.push(resolvePromise);

    const parsedManifest: T = await resolvePromise;
    const validateError: string | undefined = this.validate(manifestType, parsedManifest);

    if (validateError) {
      throw new Error(`Invalid manifest of ${manifestType}: ${parsedManifest.name}: ${validateError}`);
    }

    const pluralManifestType = `${manifestType}s` as ManifestsTypePluralName;
    const manifestsOfType = this[pluralManifestType] as Map<string, T>;

    if (manifestsOfType.get(parsedManifest.name)) {
      throw new Error(`The same ${manifestType} "${parsedManifest.name}" has been already registered!`);
    }

    this[pluralManifestType] = manifestsOfType.set(parsedManifest.name, parsedManifest);
  }

  private validate(manifestType: ManifestsTypeName, manifest: {[index: string]: any}): string | undefined {
    switch (manifestType) {
      case 'device':
        return validateDeviceManifest(manifest);
      case 'driver':
        return validateDriverManifest(manifest);
      case 'service':
        return validateServiceManifest(manifest);
    }
  }

  private async resolveManifest<T extends PreManifestBase>(manifest: string | T): Promise<T> {
    let parsedManifest: T;

    if (typeof manifest === 'string') {
      // it's path to manifest - let's load it
      // it adds a baseDir param
      parsedManifest = await this.main.$loadManifest<T>(manifest);
    }
    else if (typeof manifest === 'object') {
      const manifestObj: T = manifest;
      // it's manifest as a js object
      // baseDir is required if "main" or "files" params are specified
      if ((manifest.main || manifest.files) && !manifestObj.baseDir) {
        throw new Error(`Param "baseDir" has to be specified in manifest ${JSON.stringify(manifest)}`);
      }

      // TODO: может сразу преобразовать все пути в абсолютные?

      parsedManifest = manifest;
    }
    else {
      throw new Error(`Incorrect type of manifest: ${JSON.stringify(manifest)}`);
    }

    return parsedManifest;
  }

}
