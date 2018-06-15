import Drivers from './Drivers';


export default abstract class DriverFactoryBase {
  protected abstract DriverClass: { new (
      drivers: Drivers,
      driverParams: {[index: string]: any},
      ...params: Array<any>
    ): object };
  protected readonly drivers: Drivers;
  protected readonly driverConfig: {[index: string]: any};

  constructor(drivers: Drivers, driverConfig: {[index: string]: any} = {}) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
  }

  // TODO: возвращать обобщение

  getInstance(...params: Array<any>) {
    return new this.DriverClass(this.drivers, this.driverConfig, ...params);
  }

}
