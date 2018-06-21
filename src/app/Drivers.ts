import System from './System';


interface Driver {
  init?: () => void;
}


export default class Drivers {
  private readonly system: System;
  private readonly instances: Map<string, Driver> = new Map();

  constructor(system: System) {
    this.system = system;
  }

  init(driversPaths: Map<string, string>, driversConfig: {[index: string]: object} = {}) {
    driversPaths.forEach((driverPath: string, driverName: string) => {
      const DriverClass = this._require(driverPath);

      this.instances.set(driverName, new DriverClass(this, driversConfig[driverName]));
    });

    // initialize drivers
    for(let [key, driver] of this.instances) {
      if (driver.init) driver.init();
    }
  }

  getDriver(driverName: string): Driver | undefined {
    // TODO: вернуть тип возвращаемого драйвера
    return this.instances.get(driverName);
  }

  // it needs for test purpose
  _require(devicePath: string) {
    return require(devicePath);
  }

}
