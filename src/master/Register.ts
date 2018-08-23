import PreDeviceManifest from './interfaces/PreDeviceManifest';
import PreDriverManifest from './interfaces/PreDriverManifest';
import PreServiceManifest from './interfaces/PreServiceManifest';
import validateServiceManifest from './validateServiceManifest';
import validateDeviceManifest from './validateDeviceManifest';
import validateDriverManifest from './validateDriverManifest';
import {Map} from 'immutable';
import Plugin from './interfaces/Plugin';
import Manager from './Manager';


/**
 * Register a new type of device, driver or service
 */
export default class Register {
  private readonly plugins: Plugin[] = [];
  private readonly devicesManifests: Map<string, PreDeviceManifest> = Map<string, PreDeviceManifest>();
  private readonly driversManifests: Map<string, PreDriverManifest> = Map<string, PreDriverManifest>();
  private readonly servicesManifests: Map<string, PreServiceManifest> = Map<string, PreServiceManifest>();


  addPlugin(plugin: string | Plugin) {
    if (typeof plugin === 'string') {

      // TODO: запретить относительные пути

      this.plugins.push(this.require(plugin) as Plugin);
    }
    else if (typeof plugin === 'function') {
      this.plugins.push(plugin);
    }
    else {
      throw new Error(`Incorrect type of plugin "${JSON.stringify(plugin)}"`);
    }
  }

  addDevice(manifest: string | PreDeviceManifest) {
    let parsedManifest: PreDeviceManifest = this.resolveManifest<PreDeviceManifest>(manifest);
    const validateError: string | undefined = validateDeviceManifest(parsedManifest);

    if (validateError) {
      throw new Error(`Invalid manifest of device: ${parsedManifest.name}: ${validateError}`);
    }

    if (this.devicesManifests.get(parsedManifest.name)) {
      throw new Error(`Device "${parsedManifest.name}" is already exists!`);
    }
  }

  addDriver(manifest: string | PreDriverManifest) {
    let parsedManifest: PreDriverManifest = this.resolveManifest<PreDriverManifest>(manifest);
    const validateError: string | undefined = validateDriverManifest(parsedManifest);

    if (validateError) {
      throw new Error(`Invalid manifest of driver: ${parsedManifest.name}: ${validateError}`);
    }

    if (this.driversManifests.get(parsedManifest.name)) {
      throw new Error(`Driver "${parsedManifest.name}" is already exists!`);
    }
 }

  /**
   * Add new service to the system.
   * @param manifest - it can be path to manifest yaml file or js plain object
   */
  addService(manifest: string | PreServiceManifest): void {
    let parsedManifest: PreServiceManifest = this.resolveManifest<PreServiceManifest>(manifest);
    const validateError: string | undefined = validateServiceManifest(parsedManifest);

    if (validateError) {
      throw new Error(`Invalid manifest of service: ${parsedManifest.name}: ${validateError}`);
    }

    if (this.servicesManifests.get(parsedManifest.name)) {
      throw new Error(`Service "${parsedManifest.name}" is already exists!`);
    }
  }

  initPlugins(manager: Manager) {
    for (let plugin of this.plugins) {
      plugin(manager);
    }
  }


  private resolveManifest<T>(manifest: string | T): T {
    let parsedManifest: T;

    if (typeof manifest === 'string') {
      // TODO: load
      // TODO: если это папка - то смотреть manifest.yaml / device.yaml | driver.yaml | service.yaml
      // TODO: расширение yaml - можно подставлять - необязательно указывать
      parsedManifest = this.loadManifest(manifest) as T;
      // TODO: add baseDir
      //parsedManifest.baseDir = manifest;
    }
    else if (typeof manifest === 'object') {
      if (!(manifest as any).baseDir) {
        throw new Error(`Param "baseDir" has to be specified in manifest ${JSON.parse(manifest)}`);
      }

      parsedManifest = manifest;
    }
    else {
      throw new Error(`Incorrect type of manifest: ${JSON.parse(manifest)}`);
    }

    return parsedManifest;
  }

  private loadManifest(pathToManifest: string): {[index: string]: any} {
    // TODO: add
  }

  // it needs for test purpose
  private require(devicePath: string) {
    return require(devicePath);
  }

}
