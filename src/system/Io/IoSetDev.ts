import {IoSetBase} from '../../types/IoSet.js'
import IoItem from '../../types/IoItem.js'


export class IoSetDev implements IoSetBase {
  //prepare?(): Promise<void>

  //init?(): Promise<void>


  async destroy(): Promise<void> {

  }

  /**
   * It returns the instance of IO which was created on initialization
   * @param ioName
   */
  getIo<T extends IoItem>(ioName: string): T {
    return '' as any
  }

  /**
   * Get all the registered io names
   */
  getIoNames(): string[] {
    return []
  }
}
