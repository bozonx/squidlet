import DeviceManifest from './interfaces/DeviceManifest';
import DriverManifest from './interfaces/DriverManifest';
import ServiceManifest from './interfaces/ServiceManifest';
import validateService from './validateService';
import validateDevice from './validateDevice';
import validateDriver from './validateDriver';
import {Map} from 'immutable';
import Plugin from './interfaces/Plugin';


/**
 * Register a new type of device, driver or service
 */
export default class Registrator {
  private readonly plugins: Plugin[] = [];
  private readonly devicesManifests: Map<string, DeviceManifest> = Map<string, DeviceManifest>();
  private readonly driversManifests: Map<string, DriverManifest> = Map<string, DriverManifest>();
  private readonly servicesManifests: Map<string, ServiceManifest> = Map<string, ServiceManifest>();


  constructor() {
  }

  addPlugin(plugin: string | Plugin) {
    if (typeof plugin === 'string') {
      this.plugins.push(this.require(plugin) as Plugin);
    }
    else {
      this.plugins.push(plugin);
    }
  }

  addDevice(manifest: string | DeviceManifest) {
    let parsedManifest: ServiceManifest = this.resolveManifest<ServiceManifest>(manifest);
    const validateError: string | undefined = validateDevice(parsedManifest);

    if (this.devicesManifests.get(parsedManifest.name)) {
      throw new Error(`Device "${parsedManifest.name}" is already exists!`);
    }

    if (validateError) throw new Error(`Invalid manifest of device: ${parsedManifest.name}: ${validateError}`);

    // TODO: add base path
    // TODO: слить определения из дефолтного конфига сервиса указанного в манифесте с дефолтными значениями из главного конфига
  }

  addDriver(manifest: string | DriverManifest) {
    let parsedManifest: ServiceManifest = this.resolveManifest<ServiceManifest>(manifest);
    const validateError: string | undefined = validateDriver(parsedManifest);

    if (this.driversManifests.get(parsedManifest.name)) {
      throw new Error(`Driver "${parsedManifest.name}" is already exists!`);
    }

    if (validateError) throw new Error(`Invalid manifest of driver: ${parsedManifest.name}: ${validateError}`);

    // TODO: add base path
    // TODO: слить определения из дефолтного конфига сервиса указанного в манифесте с дефолтными значениями из главного конфига
  }

  /**
   * Add new service to the system.
   * @param manifest - it can be path to manifest yaml file or js plain object
   */
  addService(manifest: string | ServiceManifest): void {
    let parsedManifest: ServiceManifest = this.resolveManifest<ServiceManifest>(manifest);
    const validateError: string | undefined = validateService(parsedManifest);

    if (this.servicesManifests.get(parsedManifest.name)) {
      throw new Error(`Service "${parsedManifest.name}" is already exists!`);
    }

    if (validateError) {
      throw new Error(`Invalid manifest of service: ${parsedManifest.name}: ${validateError}`);
    }


    // TODO: add base path
    // TODO: слить определения из дефолтного конфига сервиса указанного в манифесте с дефолтными значениями из главного конфига
  }

  initPlugins() {
    for (let plugin of this.plugins) {
      plugin(this.configurator);
    }
  }


  private resolveManifest<T>(manifest: string | T): T {
    let parsedManifest: T;

    if (typeof manifest === 'string') {
      // TODO: load
      // TODO: если это папка - то смотреть manifest.yaml / device.yaml | driver.yaml | service.yaml
      // TODO: расширение yaml - можно подставлять - необязательно указывать
      // TODO: validate
      parsedManifest = this.loadManifest(manifest) as T;
    }
    else if (typeof manifest === 'object') {
      // TODO: validate
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
