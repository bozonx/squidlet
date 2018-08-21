import ServiceManifest from '../app/interfaces/ServiceManifest';
import validateService from './validateService';
import ManifestBase from '../app/interfaces/ManifestBase';


/**
 * Register a new type of device, driver or service
 */
export default class Registrator {
  private readonly devices = {};
  private readonly drivers = {};
  private readonly services = {};


  constructor() {

  }

  addDevice(deviceName: string) {
    // TODO: add
  }

  addDriver(driverName: string) {
    // TODO: add
  }

  /**
   * Add new service to system.
   * @param serviceName - unique name of service
   * @param manifest - it can be path to manifest yaml file or js plain object
   */
  addService(serviceName: string, manifest: string | ServiceManifest): void {
    let parsedManifest: ServiceManifest;

    if (typeof manifest === 'string') {
      // TODO: load
      // TODO: validate
      parsedManifest = this.loadManifest(manifest) as ServiceManifest;
    }
    else if (typeof manifest === 'object') {
      // TODO: validate
      parsedManifest = manifest;
    }
    else {
      throw new Error(`Incorrect type of manifest of service ${serviceName}`);
    }

    const validateError: string | undefined = validateService(parsedManifest);

    if (validateError) throw new Error(`Invalid manifest of service: ${serviceName}: ${validateError}`);


    // TODO: check unique name
    // TODO: add base path
    // TODO: слить определения с дефолтными значениями из главного конфига
    // TODO: слить определение из дефолтного конфига сервиса указанного в манифесте

  }

  private loadManifest(pathToManifest: string): {[index: string]: any} {
    // TODO: add
  }

}
