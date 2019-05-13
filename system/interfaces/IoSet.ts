import IoItem from './IoItem';
import System from '../System';


export default interface IoSet {
  prepare?(): Promise<void>;
  init(system: System): Promise<void>;
  destroy(): Promise<void>;

  getIo<T extends IoItem>(ioName: string): T;

  /**
   * Get all the names of io items
   */
  getNames(): string[];
}
