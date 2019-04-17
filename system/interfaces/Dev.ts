export default interface Dev {
  init?: () => Promise<void>;
  configure?: (params: {[index: string]: any}) => Promise<void>;
  [index: string]: any;
}
