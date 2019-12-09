/**
 * It's params which will pass to configure method on init time
 */
export interface IoDefinitions {
  [index: string]: {[index: string]: any};
}


export default interface IoItem {
  /**
   * Configure io Item.
   * It can be called several times if app switches to ioServer and app and so on.
   */
  configure?: (definition: any) => Promise<void>;
  init?: () => Promise<void>;
  destroy?: () => Promise<void>;
}
