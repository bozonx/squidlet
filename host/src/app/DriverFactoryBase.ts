import Drivers from './Drivers';
import DriverProps from './interfaces/DriverProps';


export default abstract class DriverFactoryBase {
  protected abstract DriverClass: { new (
      drivers: Drivers,
      driverProps: DriverProps,
      ...params: Array<any>
    ): object };
  protected readonly drivers: Drivers;
  protected readonly driverProps: DriverProps;

  constructor(drivers: Drivers, driverProps: DriverProps = {}) {
    this.drivers = drivers;
    this.driverProps = driverProps;
  }

  // TODO: возвращать обобщение

  getInstance(...params: Array<any>) {
    return new this.DriverClass(this.drivers, this.driverProps, ...params);
  }

}
