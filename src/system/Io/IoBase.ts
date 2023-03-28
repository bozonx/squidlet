import {IoContext} from './IoContext.js'


export class IoBase {
  // put name of IO here it it not the same as class name
  readonly name?: string

  protected readonly ctx


  constructor(ctx: IoContext) {
    this.ctx = ctx
  }

  init?: (cfg?: any) => Promise<void>

  destroy?: () => Promise<void>
}
