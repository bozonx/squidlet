import DriverInstance from './DriverInstance';


export default interface DriverFactory<T> extends DriverInstance {
  getInstance(...params: Array<any>): T;
}
