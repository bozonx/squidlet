import IoItem from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/IoItem.js';


export interface IoSetBase {
  /**
   * It returns the instance of IO which was created on initialization
   * @param ioName
   */
  getIo<T extends IoItem>(ioName: string): T;

  /**
   * Get all the names of platforms items
   */
  getNames(): string[];
}


// TODO: може переименовать в SystemIoSet
export default interface IoSet extends IoSetBase {
  /**
   * It is called before instantiating System if set.
   */
  prepare?(): Promise<void>;

  /**
   * It is called at the beginning of System initialization
   */
  init?(): Promise<void>;


  destroy(): Promise<void>;

  // TODO: зачем ???
  /**
   * Require js|ts file from local disk and execute it.
   */
  requireLocalFile(fileName: string): Promise<any>;
}
