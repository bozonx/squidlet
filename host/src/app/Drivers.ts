import { Map } from 'immutable';
import DriverManifest from './interfaces/DriverManifest';
import Driver from './interfaces/Driver';
import System from './System';
import DriverFactory from './interfaces/DriverFactory';


type DriverFactoryClass = new (drivers: Drivers, driverConfig: {[index: string]: any}) => DriverFactory;


/**
 * Drivers manager
 */
export default class Drivers {
  readonly system: System;
  private instances: Map<string, Driver> = Map<string, Driver>();

  constructor(system: System) {
    this.system = system;
  }

  /**
   * Make instances of drivers
   * @param driverManifests - uniq drivers manifests
   * @param driversConfig - user defined config for drivers
   */
  async init(driverManifests: DriverManifest[], driversConfig: {[index: string]: object} = {}): Promise<void> {

    // TODO: манифесты загружать и забывать
    // TODO: инициализировать devs
    // TODO: может конфиги брать из system?

    // make instances of drivers
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

  // TODO: наверное возвращать Drivers?
  getDriver(driverName: string): any {
    // TODO: если запрашивается dev - то вернуть dev

    const driver: Driver | undefined = this.instances.get(driverName);

    if (!driver) throw new Error(`Can't find driver "${driverName}"`);

    // TODO: как вернуть тип возвращаемого драйвера???

    return this.instances.get(driverName);
  }

  /**
   * Set platform specific devs
   * @param devs - like {DeviClassName: DevClass}
   */
  $setDevs(devs: {[index: string]: DriverFactoryClass}) {
    // TODO: указать тип - new () => any  \ DriverFactory
  }


  // it needs for test purpose
  private require(pathToFile: string) {
    return require(pathToFile);
  }

}
