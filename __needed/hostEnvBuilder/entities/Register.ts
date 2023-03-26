import * as path from 'path';
import {Map} from 'immutable';

import PreDeviceManifest from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/PreDeviceManifest.js';
import PreDriverManifest from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/PreDriverManifest.js';
import PreServiceManifest from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/PreServiceManifest.js';
import Plugin from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/Plugin.js';
import PluginEnv from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/entities/PluginEnv.js';
import PreManifestBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/PreManifestBase.js';
import Os from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/Os.js';
import systemConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/configs/systemConfig.js';
import {EntityType} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityTypes.js';
import validateManifest from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/hostConfig/validateManifests.js';
import {clearRelativePath} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/helpers.js';
import {convertEntityTypeToPlural} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/helpers.js';


/**
 * Register a new type of device, driver or service
 */
export default class Register {
  private readonly os: Os;
  private readonly plugins: Plugin[] = [];
  // devices manifest by manifest name
  private devices = Map<string, PreManifestBase>();
  // drivers manifest by manifest name
  private drivers = Map<string, PreManifestBase>();
  // services manifest by manifest name
  private services = Map<string, PreManifestBase>();
  private readonly registeringPromises: Promise<any>[] = [];


  constructor(os: Os) {
    this.os = os;
  }


  getRegisteringPromises(): Promise<any>[] {
    return this.registeringPromises;
  }

  getEntityManifest(entityType: EntityType, className: string): PreManifestBase {
    const entityTypePlural = convertEntityTypeToPlural(entityType);
    const manifest: PreManifestBase | undefined = this[entityTypePlural].get(className);

    if (!manifest) {
      throw new Error(`Can't find a manifest of "${entityType}" "${className}"`);
    }

    return manifest;
  }

  addPlugin(plugin: string | Plugin) {
    if (typeof plugin === 'string') {
      // it's path to plugin - let's load it
      if (!path.isAbsolute(plugin)) {
        throw new Error(`You have to specify an absolute path of "${plugin}"`);
      }

      const pluginFunction: Plugin = this.require(plugin).default;

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


  private async addEntity<T extends PreManifestBase>(entityType: EntityType, manifest: string | T) {
    const resolvePromise: Promise<T> = this.resolveManifest<T>(manifest);

    this.registeringPromises.push(resolvePromise);

    const parsedManifest: T = await resolvePromise;

    const validateError: string | undefined = validateManifest(entityType, parsedManifest);

    if (validateError) {
      throw new Error(`Invalid manifest of ${entityType}: ${parsedManifest.name}: ${validateError}`);
    }

    const pluralManifestType = convertEntityTypeToPlural(entityType);
    const manifestsOfType = this[pluralManifestType] as Map<string, T>;

    if (manifestsOfType.get(parsedManifest.name)) {
      throw new Error(`The same ${entityType} "${parsedManifest.name}" has been already registered!`);
    }

    this[pluralManifestType] = manifestsOfType.set(parsedManifest.name, parsedManifest);
  }

  private async resolveManifest<T extends PreManifestBase>(manifest: string | T): Promise<T> {
    let parsedManifest: T;

    if (typeof manifest === 'string') {
      // it's path to manifest or dir where manifests is placed - let's load it
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

    return this.normalizeManifest<T>(parsedManifest);
  }

  private async normalizeManifest<T extends PreManifestBase>(preManifest: T): Promise<T> {
    // Load props file if it set as a path to yaml file
    if (typeof preManifest.props === 'string') {
      const propPath = path.resolve(preManifest.baseDir, preManifest.props);

      preManifest.props = await this.os.loadYamlFile(propPath);
    }

    // clear path to main file
    preManifest.main = clearRelativePath(preManifest.main);

    // clear paths in files
    if (preManifest.files) {
      for (let index in preManifest.files) {
        preManifest.files[index] = clearRelativePath(preManifest.files[index]);
      }
    }

    return preManifest;
  }

  private async loadManifest<T extends PreManifestBase>(pathToDirOrFile: string): Promise<T> {
    if (pathToDirOrFile.indexOf('/') !== 0) {
      throw new Error(`You have to specify an absolute path of "${pathToDirOrFile}"`);
    }

    const resolvedPathToManifest: string = await this.resolveIndexFile(
      pathToDirOrFile,
      systemConfig.indexManifestFileNames
    );
    const parsedManifest = (await this.os.loadYamlFile(resolvedPathToManifest)) as T;

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
    if (!(await this.os.stat(pathToDirOrFile)).dir) {
      // if it's file - return it
      return pathToDirOrFile;
    }
    // else it is dir

    for (let indexFile of indexFileNames) {
      const fullPath = path.join(pathToDirOrFile, indexFile);

      if (await this.os.exists(fullPath)) {
        return fullPath;
      }
    }

    throw new Error(`Can't resolve index file "${pathToDirOrFile}"`);
  }

}
