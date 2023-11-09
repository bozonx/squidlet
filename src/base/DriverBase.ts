import type {DriverContext} from '../system/context/DriverContext.js'


export class DriverBase {
  // put name of the driver here if it not the same as class name
  readonly myName?: string
  readonly requireIo?: string[]

  protected readonly ctx: DriverContext


  constructor(ctx: DriverContext) {
    this.ctx = ctx
  }

  init?(cfg?: Record<string, any>): Promise<void>
  destroy?(): Promise<void>
}
