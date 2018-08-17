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
   * @param driverManifests - uniq drivers manifests like {DriverName: DriverManifest}
   * @param driversConfig - user devined config for drivers
   */
  init(driverManifests: {[index: string]: DriverManifest}, driversConfig: {[index: string]: object} = {}) {
    const sortedDrivers: {[index: string]: DriverManifest} = this.sort(driverManifests);

    const DriverClass = this.require(driverManifestPath).default;

    this.instances = this.instances.set(driverName, new DriverClass(this, driversConfig[driverName]));

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

  // private loadManifests(driversPaths: Map<string, string>): {[index: string]: DriverManifest} {
  //   const manifests: {[index: string]: DriverManifest} = {};
  //
  //   driversPaths.forEach((driverManifestPath?: string, driverName?: string) => {
  //     if (!driverManifestPath || !driverName) {
  //       throw new Error(`Wrong driver definition "${driverName}": "${driverManifestPath}"`);
  //     }
  //
  //
  //   });
  //
  //   return manifests;
  // }

  private generateDriversMainFilePaths() {

  }

  private sort(driverManifests: {[index: string]: DriverManifest}): {[index: string]: DriverManifest} {

  }

  // it needs for test purpose
  private require(devicePath: string) {
    return require(devicePath);
  }

}
