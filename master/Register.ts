const _map = require('lodash/map');

import PreDeviceManifest from './interfaces/PreDeviceManifest';
import PreDriverManifest from './interfaces/PreDriverManifest';
import PreServiceManifest from './interfaces/PreServiceManifest';
import validateServiceManifest from './validateServiceManifest';
import validateDeviceManifest from './validateDeviceManifest';
import validateDriverManifest from './validateDriverManifest';
import {loadManifest} from './IO';
import {Map} from 'immutable';
import Plugin from './interfaces/Plugin';
import Manager from './Manager';
import PreManifestBase from './interfaces/PreManifestBase';


/**
 * Register a new type of device, driver or service
 */
export default class Register {
  private readonly plugins: Plugin[] = [];
  private readonly devicesManifests: Map<string, PreDeviceManifest> = Map<string, PreDeviceManifest>();
  private readonly driversManifests: Map<string, PreDriverManifest> = Map<string, PreDriverManifest>();
  private readonly servicesManifests: Map<string, PreServiceManifest> = Map<string, PreServiceManifest>();
  private registerPromises: Promise<any>[] = [];


  // TODO: зачем преобразовывать в массив ?????

  getDevicesPreManifests(): PreDeviceManifest[] {
    return _map(this.devicesManifests.toJS());
  }

  getDriversPreManifests(): PreDriverManifest[] {
    return _map(this.driversManifests.toJS());
  }

  getServicesPreManifests(): PreServiceManifest[] {
    return _map(this.servicesManifests.toJS());
  }

  getRegisterPromises(): Promise<any>[] {
    return this.registerPromises;
  }

  addPlugin(plugin: string | Plugin) {
    if (typeof plugin === 'string') {
      // it's path to plugin - let's load it
      if (plugin.indexOf('/') !== 0) {
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

  async addDevice(manifest: string | PreDeviceManifest) {
    const resolvePromise: Promise<PreDeviceManifest> = this.resolveManifest<PreDeviceManifest>(manifest);

    this.registerPromises.push(resolvePromise);

    const parsedManifest = await resolvePromise;
    const validateError: string | undefined = validateDeviceManifest(parsedManifest);

    if (validateError) {
      throw new Error(`Invalid manifest of device: ${parsedManifest.name}: ${validateError}`);
    }

    if (this.devicesManifests.get(parsedManifest.name)) {
      throw new Error(`Device "${parsedManifest.name}" is already exists!`);
    }

    this.devicesManifests.set(parsedManifest.name, parsedManifest);
  }

  async addDriver(manifest: string | PreDriverManifest) {
    const resolvePromise: Promise<PreDriverManifest> = this.resolveManifest<PreDriverManifest>(manifest);

    this.registerPromises.push(resolvePromise);

    const parsedManifest = await resolvePromise;
    const validateError: string | undefined = validateDriverManifest(parsedManifest);

    if (validateError) {
      throw new Error(`Invalid manifest of driver: ${parsedManifest.name}: ${validateError}`);
    }

    if (this.driversManifests.get(parsedManifest.name)) {
      throw new Error(`Driver "${parsedManifest.name}" is already exists!`);
    }

    this.driversManifests.set(parsedManifest.name, parsedManifest);
 }

  /**
   * Add new service to the system.
   * @param manifest - it can be path to manifest yaml file or js plain object
   */
  async addService(manifest: string | PreServiceManifest) {
    const resolvePromise: Promise<PreServiceManifest> = this.resolveManifest<PreServiceManifest>(manifest);

    this.registerPromises.push(resolvePromise);

    const parsedManifest = await resolvePromise;
    const validateError: string | undefined = validateServiceManifest(parsedManifest);

    if (validateError) {
      throw new Error(`Invalid manifest of service: ${parsedManifest.name}: ${validateError}`);
    }

    if (this.servicesManifests.get(parsedManifest.name)) {
      throw new Error(`Service "${parsedManifest.name}" is already exists!`);
    }

    this.servicesManifests.set(parsedManifest.name, parsedManifest);
  }

  async initPlugins(manager: Manager) {
    for (let plugin of this.plugins) {
      await plugin(manager);
    }
  }


  private async resolveManifest<T extends PreManifestBase>(manifest: string | T): Promise<T> {
    let parsedManifest: T;

    if (typeof manifest === 'string') {
      // it's path to manifest - let's load it
      parsedManifest = await this.loadManifest<T>(manifest);
    }
    else if (typeof manifest === 'object') {
      // it's manifest as a js object
      if (!(manifest as any).baseDir) {
        throw new Error(`Param "baseDir" has to be specified in manifest ${JSON.stringify(manifest)}`);
      }

      parsedManifest = manifest;
    }
    else {
      throw new Error(`Incorrect type of manifest: ${JSON.stringify(manifest)}`);
    }

    return parsedManifest;
  }

  private async loadManifest<T extends PreManifestBase>(resolvedPathToManifest: string): Promise<T> {
    return await loadManifest<T>(resolvedPathToManifest);
  }

  // it needs for test purpose
  private require(devicePath: string) {
    return require(devicePath);
  }

}
