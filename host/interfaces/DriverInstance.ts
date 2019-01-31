export default interface DriverInstance {

  // TODO: add constructor

  init?: () => Promise<void>;
  [index: string]: any;
}
