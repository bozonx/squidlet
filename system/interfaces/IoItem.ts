/**
 * It's params which will pass to configure method on init time
 */
export interface IoItemDefinition {
  [index: string]: {[index: string]: any};
}


export default interface IoItem {
  init?: () => Promise<void>;
  configure?: (params: {[index: string]: any}) => Promise<void>;
  destroy?: () => Promise<void>;
  //[index: string]: undefined | ((...args: any[]) => Promise<any>);
}
