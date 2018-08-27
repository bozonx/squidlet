import DriverInstance from './DriverInstance';


export default interface DriverFactory {
  // TODO: use DriverInstance
  getInstance: (...params: Array<any>) => any;
  [index: string]: any;
}
