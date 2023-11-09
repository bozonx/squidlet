import type {IoContext} from '../system/context/IoContext.js'


export class IoBase {
  // put name of the IO here it it not the same as class name
  readonly myName?: string

  protected readonly ctx


  constructor(ctx: IoContext) {
    this.ctx = ctx
  }

  init?(cfg?: any): Promise<void>
  destroy?(): Promise<void>

  // /**
  //  * Setup props before init.
  //  * It allowed to call it more than once.
  //  */
  // configure?(definition?: any): Promise<void>

}
