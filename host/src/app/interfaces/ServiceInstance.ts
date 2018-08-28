export default interface ServiceInstance {
  init?: () => Promise<void>;
  [index: string]: any;
}
