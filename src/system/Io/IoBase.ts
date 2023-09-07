import {IoContext} from './IoContext.js'
import {IoItem} from '../../IoSets/IoItem.js'


export class IoBase implements IoItem {
  // put name of the IO here it it not the same as class name
  readonly myName?: string

  protected readonly ctx


  constructor(ctx: IoContext) {
    this.ctx = ctx
  }

  init?(cfg?: any): Promise<void>
  destroy?(): Promise<void>
}
