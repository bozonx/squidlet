import {IoContext} from '../system/Io/IoContext.js'


export interface IoItem {
  /**
   * Initialize platforms Item at System initialization time. It isn't allowed to call it more than once.
   */
  init?(ioContext: IoContext): Promise<void>

  /**
   * Setup props before init.
   * It allowed to call it more than once.
   */
  configure?(definition?: any): Promise<void>

  destroy?(): Promise<void>
}
