import {IoBase} from '../../system/Io/IoBase.js'


export class HttpServerIo extends IoBase {

  async init(): Promise<void> {
    await super.init()
  }

  async destroy(): Promise<void> {
    await super.destroy()
  }
}
