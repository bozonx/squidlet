export default interface IoItem {
  init?: () => Promise<void>;
  configure?: (params: {[index: string]: any}) => Promise<void>;
  destroy?: () => Promise<void>;
  //[index: string]: undefined | ((...args: any[]) => Promise<any>);
}
