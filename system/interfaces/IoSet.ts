import IoItem from './IoItem';


export default interface IoSet {
  getIo<T extends IoItem>(ioName: string): T;

  /**
   * Get all the names of io items
   */
  getNames(): string[];
}
