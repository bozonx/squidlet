import {IoContext} from './IoContext.js'


export abstract class IoBase {
  readonly abstract name: string
  private readonly ctx


  constructor(ctx: IoContext) {
    this.ctx = ctx
  }

  init?: (cfg?: Record<string, any>) => Promise<void>

  destroy?: () => Promise<void>

}
