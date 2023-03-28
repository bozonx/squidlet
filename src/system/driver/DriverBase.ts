import {DriverContext} from './DriverContext.js'


export class DriverBase {
  readonly requireIo?: string[]
  // dirver name
  readonly name?: string

  protected readonly ctx: DriverContext


  constructor(ctx: DriverContext) {
    this.ctx = ctx
  }

  init?: (cfg?: Record<string, any>) => Promise<void>

  destroy?: () => Promise<void>

}
