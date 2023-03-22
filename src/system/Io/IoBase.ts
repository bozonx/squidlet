import {System} from '../System.js'
import {IoContext} from './IoContext.js'


export abstract class IoBase {
  readonly abstract name: string
  private readonly ctx


  constructor(ctx: IoContext) {
    this.ctx = ctx
  }

  async init() {
  }

  async destroy() {
  }
}
