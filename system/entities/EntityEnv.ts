import HostConfig from '../interfaces/HostConfig';
import IoItem from '../interfaces/IoItem';
import LogPublisher from '../LogPublisher';
import DriverBase from '../baseDrivers/DriverBase';


/**
 * It is environment for devices and services
 */
export default class EntityEnv {
  readonly context: Context;

  // get api(): Api {
  //   return this.system.api;
  // }
  // get events(): IndexedEventEmitter {
  //   return this.system.events;
  // }
  get log(): LogPublisher {
    return this.context.log;
  }
  get config(): HostConfig {
    return this.context.config;
  }


  constructor(context: Context) {
    this.context = context;
  }


  getIo<T extends IoItem>(shortDevName: string): T {
    //return this.system.driversManager.getDev<T>(shortDevName);
    return this.context.system.ioManager.getIo<T>(shortDevName);
  }

  getDriver<T extends DriverBase>(driverName: string): T {
    return this.context.system.driversManager.getDriver<T>(driverName);
  }

}
