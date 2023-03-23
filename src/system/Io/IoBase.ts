import {System} from '../System.js'
import {IoContext} from './IoContext.js'


export abstract class IoBase {
  readonly abstract name: string
  private readonly ctx


  constructor(ctx: IoContext) {
    this.ctx = ctx
  }

  init?: () => Promise<void>

  /**
   * Setup props before init.
   * It allowed to call it more than once.
   */
  configure?: (cfg: Record<string, any>) => Promise<void>

  asdestroy?: () => Promise<void>

}
