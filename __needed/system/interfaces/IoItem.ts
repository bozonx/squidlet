import IoContext from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/IoContext.js';


export interface IoDefinitions {
  [index: string]: {[index: string]: any};
}


export default interface IoItem {
  /**
   * Initialize platforms Item at System initialization time. It isn't allowed to call it more than once.
   */
  init?: (ioContext: IoContext) => Promise<void>;

  /**
   * Setup props before init.
   * It allowed to call it more than once.
   */
  configure?: (definition?: any) => Promise<void>;

  destroy?: () => Promise<void>;
}
