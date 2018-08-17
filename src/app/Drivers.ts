import { Map } from 'immutable';


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

  init(driversPaths: Map<string, string>, driversConfig: {[index: string]: object} = {}) {
    driversPaths.forEach((driverPath: string | undefined, driverName: string | undefined) => {
      if (!driverPath || !driverName) return;

      const DriverClass = this.require(driverPath).default;

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

  // it needs for test purpose
  private require(devicePath: string) {
    return require(devicePath);
  }

}
