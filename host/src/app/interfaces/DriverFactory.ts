import Driver from './Driver';


export default interface DriverFactory {
  getInstance: (...params: Array<any>) => any;
  [index: string]: any;
}
