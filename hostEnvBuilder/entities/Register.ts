import * as path from 'path';
import {Map} from 'immutable';

import PreDeviceManifest from '../interfaces/PreDeviceManifest';
import PreDriverManifest from '../interfaces/PreDriverManifest';
import PreServiceManifest from '../interfaces/PreServiceManifest';
import validateServiceManifest from './validateServiceManifest';
import validateDeviceManifest from './validateDeviceManifest';
import validateDriverManifest from './validateDriverManifest';
import Plugin from '../interfaces/Plugin';
import PluginEnv from './PluginEnv';
import PreManifestBase from '../interfaces/PreManifestBase';
import Io from '../Io';
import systemConfig from '../configs/systemConfig';
import {ManifestsTypeName, ManifestsTypePluralName} from '../../host/interfaces/ManifestTypes';
import {Stats} from '../../host/interfaces/dev/StorageDev';


/**
 * Register a new type of device, driver or service
 */
export default class Register {
  private readonly io: Io;
  private readonly plugins: Plugin[] = [];
  // devices manifest by manifest name
  private devices = Map<string, PreManifestBase>();
  // drivers manifest by manifest name
  private drivers = Map<string, PreManifestBase>();
  // services manifest by manifest name
  private services = Map<string, PreManifestBase>();
  private readonly registeringPromises: Promise<any>[] = [];


  constructor(io: Io) {
    this.io = io;
  }


  getRegisteringPromises(): Promise<any>[] {
    return this.registeringPromises;
  }

  getEntityManifest(pluralManifestType: ManifestsTypePluralName, className: string): PreManifestBase {
    const manifest: PreManifestBase | undefined = this[pluralManifestType].get(className);

    if (!manifest) {
      throw new Error(`Can't find a manifest of "${pluralManifestType}" "${className}"`);
    }

    return manifest;
  }

  addPlugin(plugin: string | Plugin) {
    if (typeof plugin === 'string') {
      // it's path to plugin - let's load it
      if (!path.isAbsolute(plugin)) {
        throw new Error(`You have to specify an absolute path of "${plugin}"`);
      }

      const pluginFunction: Plugin = this.require(plugin);

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
      parsedManifest = await this.loadManifest<T>(manifest);
    }
    else if (typeof manifest === 'object') {
      const manifestObj: T = manifest;
      // it's manifest as a js object
      // baseDir is required if "main" or "files" params are specified
      if ((manifest.main || manifest.files) && !manifestObj.baseDir) {
        throw new Error(`Param "baseDir" has to be specified in manifest ${JSON.stringify(manifest)}`);
      }

      parsedManifest = manifest;
    }
    else {
      throw new Error(`Incorrect type of manifest: ${JSON.stringify(manifest)}`);
    }

    return parsedManifest;
  }

  private async loadManifest<T extends PreManifestBase>(pathToDirOrFile: string): Promise<T> {
    if (pathToDirOrFile.indexOf('/') !== 0) {
      throw new Error(`You have to specify an absolute path of "${pathToDirOrFile}"`);
    }

    const resolvedPathToManifest: string = await this.resolveIndexFile(
      pathToDirOrFile,
      systemConfig.indexManifestFileNames
    );
    const parsedManifest = (await this.io.loadYamlFile(resolvedPathToManifest)) as T;

    parsedManifest.baseDir = path.dirname(resolvedPathToManifest);

    return parsedManifest;
  }

  // it needs for test purpose
  private require(devicePath: string) {
    return require(devicePath);
  }

  private async resolveIndexFile(
    pathToDirOrFile: string,
    indexFileNames: string[]
  ): Promise<string> {
    if (!(await this.io.stat(pathToDirOrFile)).dir) {
      // if it's file - return it
      return pathToDirOrFile;
    }
    // else it is dir

    for (let indexFile of indexFileNames) {
      const fullPath = path.join(pathToDirOrFile, indexFile);

      if (await this.io.exists(fullPath)) {
        return fullPath;
      }
    }

    throw new Error(`Can't resolve index file "${pathToDirOrFile}"`);
  }

}
