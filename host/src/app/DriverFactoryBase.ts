import DriverEnv from './DriverEnv';
import DriverProps from './interfaces/DriverProps';


export default abstract class DriverFactoryBase {
  protected abstract DriverClass: { new (
      driverEnv: DriverEnv,
      driverProps: DriverProps,
      ...params: Array<any>
    ): object };
  protected readonly driverEnv: DriverEnv;
  protected readonly driverProps: DriverProps;

  constructor(driverEnv: DriverEnv, driverProps: DriverProps = {}) {
    this.driverEnv = driverEnv;
    this.driverProps = driverProps;
  }

  // TODO: возвращать обобщение

  getInstance(...params: Array<any>) {
    return new this.DriverClass(this.driverEnv, this.driverProps, ...params);
  }

}
