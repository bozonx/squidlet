/**
 * It's params which will pass to configure method on init time
 */
export interface IoItemDefinition {
  [index: string]: {[index: string]: any};
}


export default interface IoItem {
  configure?: (params: any) => Promise<void>;
  destroy?: () => Promise<void>;
}
