import {DriverContext} from './DriverContext.js'


export abstract class DriverBase {
  // dirver name
  readonly abstract name: string
  private readonly ctx: DriverContext


  constructor(ctx: DriverContext) {
    this.ctx = ctx
  }

  init?: (cfg?: Record<string, any>) => Promise<void>

  destroy?: () => Promise<void>

}
