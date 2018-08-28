import DriverInstance from './DriverInstance';


// TODO: remove

export default interface DriverFactory {
  // TODO: use DriverInstance
  getInstance: (...params: Array<any>) => any;
  [index: string]: any;
}
