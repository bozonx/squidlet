import { Map } from 'immutable';
import DriverInstance from './interfaces/DriverInstance';
import System from './System';



/**
 * It is singleton which is passed to all the drivers
 */
export default class Drivers {
  readonly system: System;
  private instances: Map<string, DriverInstance> = Map<string, DriverInstance>();

  constructor(system: System) {
    this.system = system;
  }


  getDev<T>(shortDevName: string): T {

  }

  // TODO: наверное возвращать Drivers?
  getDriver<T>(driverName: string): T {
    // TODO: если запрашивается dev - то вернуть dev

    const driver: DriverInstance | undefined = this.instances.get(driverName);

    if (!driver) throw new Error(`Can't find driver "${driverName}"`);

    // TODO: как вернуть тип возвращаемого драйвера???

    return this.instances.get(driverName);
  }

}
