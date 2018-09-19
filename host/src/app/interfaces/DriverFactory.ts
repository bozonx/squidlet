export default interface DriverFactory<T> {
  getInstance(...params: Array<any>): T;
  [index: string]: any;
}
