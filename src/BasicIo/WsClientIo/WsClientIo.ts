import {IoBase} from '../../system/Io/IoBase.js'
import {IoContext} from '../../system/Io/IoContext.js'


export class WsClientIo extends IoBase {

  constructor(ctx: IoContext) {
    super(ctx)
  }

  async init(): Promise<void> {
    await super.init()
  }

  async destroy(): Promise<void> {
    await super.destroy()
  }
}
