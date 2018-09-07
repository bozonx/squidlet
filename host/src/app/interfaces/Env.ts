import DriverInstance from './DriverInstance';


export default interface Env {
  getDev<T extends DriverInstance>(shortDevName: string): T;
  getDriver<T extends DriverInstance>(driverName: string): T;
  [index: string]: any;
}
