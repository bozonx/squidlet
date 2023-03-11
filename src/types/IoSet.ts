import IoItem from './IoItem.js'


export interface IoSetBase {
  /**
   * It is called before instantiating System if set.
   */
  prepare?(): Promise<void>

  /**
   * It is called at the beginning of System initialization
   */
  init?(): Promise<void>


  destroy(): Promise<void>

  /**
   * It returns the instance of IO which was created on initialization
   * @param ioName
   */
  getIo<T extends IoItem>(ioName: string): T

  /**
   * Get all the registered io names
   */
  getIoNames(): string[]
}
