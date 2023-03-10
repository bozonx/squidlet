import IoItem from './IoItem';


export default interface IoSet {
  /**
   * It is called before instantiating System if set.
   */
  prepare?(): Promise<void>;

  /**
   * It is called at the beginning of System initialization
   */
  init?(): Promise<void>;


  destroy(): Promise<void>;

  /**
   * It returns the instance of IO which was created on initialization
   * @param ioName
   */
  getIo<T extends IoItem>(ioName: string): T;

  /**
   * Get all the names of platforms items
   */
  getNames(): string[];

  /**
   * Require js|ts file from local disk and execute it.
   */
  requireLocalFile(fileName: string): Promise<any>;
}
