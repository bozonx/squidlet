export default interface DriverInstance {
  init?: () => Promise<void>;
  [index: string]: any;
}
