import IoItem from './IoItem';
import System from '../System';


export default interface IoSet {
  /**
   * It is called before instantiating System if set.
   */
  prepare?(): Promise<void>;

  /**
   * It is called at the beginning of System initialization
   */
  init(system: System): Promise<void>;


  destroy(): Promise<void>;

  getIo<T extends IoItem>(ioName: string): T;

  /**
   * Get all the names of io items
   */
  getNames(): string[];
}
