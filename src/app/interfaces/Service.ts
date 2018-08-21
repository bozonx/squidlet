export default interface Service {
  init: () => Promise<void>;
  [index: string]: any;
}
