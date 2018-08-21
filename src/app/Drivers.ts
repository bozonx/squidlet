import { Map } from 'immutable';
import DriverManifest from './interfaces/DriverManifest';
import Driver from './interfaces/Driver';


/**
 * Drivers manager
 */
export default class Drivers {
  private instances: Map<string, Driver> = Map<string, Driver>();

  /**
   * Make instances of drivers
   * @param driverManifests - uniq drivers manifests
   * @param driversConfig - user defined config for drivers
   */
  async init(driverManifests: DriverManifest[], driversConfig: {[index: string]: object} = {}): Promise<void> {
    // make instances
    for (let manifest of driverManifests) {
      const DriverClass = this.require(manifest.main).default;
      const instance: Driver = new DriverClass(this, driversConfig[manifest.name]);

      this.instances = this.instances.set(manifest.name, instance);
    }

    // initialize drivers
    await Promise.all(Object.keys(this.instances).map(async (name: string): Promise<void> => {
      const driver: Driver = this.instances.get(name);

      await driver.init();
    }));
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
