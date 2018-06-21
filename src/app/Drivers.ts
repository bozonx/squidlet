import { Map } from 'immutable';

import System from './System';


interface Driver {
  init?: () => void;
}


export default class Drivers {
  private readonly system: System;
  private instances: Map<string, Driver> = Map<string, Driver>();

  constructor(system: System) {
    this.system = system;
  }

  init(driversPaths: Map<string, string>, driversConfig: {[index: string]: object} = {}) {
    driversPaths.forEach((driverPath: string | undefined, driverName: string | undefined) => {
      if (!driverPath || !driverName) return;

      const DriverClass = this.require(driverPath);

      this.instances = this.instances.set(driverName, new DriverClass(this, driversConfig[driverName]));
    });

    // initialize drivers
    this.instances.forEach((driver: Driver | undefined) => {
      if (driver && driver.init) driver.init();
    });

  }

  getDriver(driverName: string): Driver | undefined {
    // TODO: вернуть тип возвращаемого драйвера
    return this.instances.get(driverName);
  }

  // it needs for test purpose
  private require(devicePath: string) {
    return require(devicePath);
  }

}
