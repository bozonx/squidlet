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
   * @param driverManifests - uniq drivers manifests
   * @param driversConfig - user defined config for drivers
   */
  init(driverManifests: DriverManifest[], driversConfig: {[index: string]: object} = {}) {
    // make instances
    for (let manifest of driverManifests) {
      const DriverClass = this.require(manifest.main).default;
      const instance: Driver = new DriverClass(this, driversConfig[manifest.name]);

      this.instances = this.instances.set(manifest.name, instance);
    }

    // TODO: сделать Promise.all
    // TODO: потом поднять событие что драйверы инициализировались

    // initialize drivers
    this.instances.forEach((driver: Driver | undefined) => {
      if (driver && driver.init) driver.init();
    });
  }

  getDriver(driverName: string): Driver {
    const driver: Driver = this.instances.get(driverName);

    if (!driver) throw new Error(`Can't find driver "${driverName}"`);

    // TODO: как вернуть тип возвращаемого драйвера???

    return this.instances.get(driverName);
  }

  // it needs for test purpose
  private require(devicePath: string) {
    return require(devicePath);
  }

}
