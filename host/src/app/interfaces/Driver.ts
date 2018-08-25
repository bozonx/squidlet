export default interface Driver {
  init: () => Promise<void>;
  [index: string]: any;
}
