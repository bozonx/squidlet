import { Map } from 'immutable';
import DriverManifest from './interfaces/DriverManifest';
import Driver from './interfaces/Driver';
import System from './System';
import DriverFactory from './interfaces/DriverFactory';
import DriverDefinition from './interfaces/DriverDefinition';
import StorageDev from './interfaces/dev/Storage.dev';


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
   */
  async init(): Promise<void> {
    const storage: StorageDev = this.getDev<StorageDev>('Storage');



    // TODO: пройтись по папке drivers в хранилище
    // TODO: загрузить все манифесты
    // TODO: выписать системные и не системные имена драйверов
    // TODO: создать инстансы всех драйверов


    const driversConfig: DriverDefinition[] = this.system.host.config.drivers;
    // driverManifests: DriverManifest[],
    // TODO: собрать список системных и обычных драйверов

    // TODO: манифесты загружать и забывать
    // TODO: инициализировать devs
    // TODO: может конфиги брать из system?

    // make instances of drivers
    for (let manifest of driverManifests) {
      const DriverClass = this.require(manifest.main).default;
      const instance: Driver = new DriverClass(this, driversConfig[manifest.name]);

      this.instances = this.instances.set(manifest.name, instance);
    }

  }

  getDev<T>(shortDevName: string): T {

  }

  // TODO: наверное возвращать Drivers?
  getDriver(driverName: string): any {
    // TODO: если запрашивается dev - то вернуть dev

    const driver: Driver | undefined = this.instances.get(driverName);

    if (!driver) throw new Error(`Can't find driver "${driverName}"`);

    // TODO: как вернуть тип возвращаемого драйвера???

    return this.instances.get(driverName);
  }


  async $initSystemDrivers(): Promise<void> {
    // TODO: только системные драйверы и dev
    // TODO: потом поднять событие что драйверы инициализировались


    // initialize drivers
    await Promise.all(Object.keys(this.instances).map(async (name: string): Promise<void> => {
      const driver: Driver = this.instances.get(name);

      await driver.init();
    }));

    // TODO: удалить список системных драйверов
  }

  async $initUserLayerDrivers(): Promise<void> {
    // initialize drivers
    await Promise.all(Object.keys(this.instances).map(async (name: string): Promise<void> => {
      const driver: Driver = this.instances.get(name);

      await driver.init();
    }));

    // TODO: удалить список пользовательских драйверов
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
