import DeviceManifest from '../app/interfaces/DeviceManifest';
import DriverManifest from '../app/interfaces/DriverManifest';
import ServiceManifest from '../app/interfaces/ServiceManifest';
import validateService from './validateService';
import validateDevice from './validateDevice';
import validateDriver from './validateDriver';


/**
 * Register a new type of device, driver or service
 */
export default class Registrator {
  private readonly devicesManifests: {[index: string]: DeviceManifest} = {};
  private readonly driversManifests: {[index: string]: DriverManifest} = {};
  private readonly servicesManifests: {[index: string]: ServiceManifest} = {};


  constructor() {
  }

  addDevice(manifest: string | DeviceManifest) {
    let parsedManifest: ServiceManifest = this.resolveManifest<ServiceManifest>(manifest);
    const validateError: string | undefined = validateDevice(parsedManifest);

    if (validateError) throw new Error(`Invalid manifest of device: ${parsedManifest.name}: ${validateError}`);

    // TODO: check unique name
    // TODO: add base path
    // TODO: слить определения с дефолтными значениями из главного конфига
    // TODO: слить определение из дефолтного конфига сервиса указанного в манифесте
  }

  addDriver(manifest: string | DriverManifest) {
    let parsedManifest: ServiceManifest = this.resolveManifest<ServiceManifest>(manifest);
    const validateError: string | undefined = validateDriver(parsedManifest);

    if (validateError) throw new Error(`Invalid manifest of driver: ${parsedManifest.name}: ${validateError}`);

    // TODO: check unique name
    // TODO: add base path
    // TODO: слить определения с дефолтными значениями из главного конфига
    // TODO: слить определение из дефолтного конфига сервиса указанного в манифесте
  }

  /**
   * Add new service to the system.
   * @param manifest - it can be path to manifest yaml file or js plain object
   */
  addService(manifest: string | ServiceManifest): void {
    let parsedManifest: ServiceManifest = this.resolveManifest<ServiceManifest>(manifest);
    const validateError: string | undefined = validateService(parsedManifest);

    if (validateError) throw new Error(`Invalid manifest of service: ${parsedManifest.name}: ${validateError}`);


    // TODO: check unique name
    // TODO: add base path
    // TODO: слить определения с дефолтными значениями из главного конфига
    // TODO: слить определение из дефолтного конфига сервиса указанного в манифесте

  }

  private resolveManifest<T>(manifest: string | T): T {
    let parsedManifest: T;

    if (typeof manifest === 'string') {
      // TODO: load
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

}
