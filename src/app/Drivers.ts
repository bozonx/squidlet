import { Map } from 'immutable';
import DriverManifest from './interfaces/DriverManifest';


interface Driver {
  init?: () => void;
}


/**
 * Drivers manager
 */
export default class Drivers {
  private instances: Map<string, Driver> = Map<string, Driver>();

  constructor() {
  }

  /**
   * Make instances of drivers
   * @param driversPaths - uniq drivers like {DriverName: pathToManifest}
   * @param driversConfig - user devined config for drivers
   */
  init(driversPaths: Map<string, string>, driversConfig: {[index: string]: object} = {}) {
    const manifests: {[index: string]: DriverManifest} = this.loadManifests();

    driversPaths.forEach((driverManifestPath?: string, driverName?: string) => {
      if (!driverManifestPath || !driverName) {
        throw new Error(`Wrong driver definition "${driverName}": "${driverManifestPath}"`);
      }

      const DriverClass = this.require(driverManifestPath).default;

      this.instances = this.instances.set(driverName, new DriverClass(this, driversConfig[driverName]));
    });

    // initialize drivers
    this.instances.forEach((driver: Driver | undefined) => {
      if (driver && driver.init) driver.init();
    });

  }

  getDriver(driverName: string): Driver | undefined {

    // TODO: если драйвера нет - throw

    // TODO: вернуть тип возвращаемого драйвера
    return this.instances.get(driverName);
  }

  private loadManifests() {

  }

  private generateDriversMainFilePaths() {

  }

  private sortDrivers() {

  }

  // it needs for test purpose
  private require(devicePath: string) {
    return require(devicePath);
  }

}
