import { Map } from 'immutable';
import DriverManifest from './interfaces/DriverManifest';
import DriverInstance from './interfaces/DriverInstance';
import System from './System';
import DriverFactory from './interfaces/DriverFactory';
import DriverDefinition from './interfaces/DriverDefinition';
import FsDev from './interfaces/dev/Fs.dev';


type DriverFactoryClass = new (drivers: Drivers, driverConfig: {[index: string]: any}) => DriverFactory;


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
  getDriver(driverName: string): any {
    // TODO: если запрашивается dev - то вернуть dev

    const driver: DriverInstance | undefined = this.instances.get(driverName);

    if (!driver) throw new Error(`Can't find driver "${driverName}"`);

    // TODO: как вернуть тип возвращаемого драйвера???

    return this.instances.get(driverName);
  }

}
