import Drivers from './Drivers';


export default abstract class DriverFactoryBase {
  abstract DriverClass: { new (
    drivers: Drivers,
    driverParams: {[index: string]: any},
    ...params: Array<any>
  ): object };
  private readonly drivers: Drivers;
  private readonly driverConfig: {[index: string]: any};

  constructor(drivers: Drivers, driverConfig: {[index: string]: any} = {}) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
  }

  getInstance(...params: Array<any>) {
    return new this.DriverClass(this.drivers, this.driverConfig, ...params);
  }

}
