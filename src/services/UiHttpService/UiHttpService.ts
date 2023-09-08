// TODO: должен запускать UI и отдавать его через http

import {ServiceIndex, SubprogramError} from '../../types/types.js'
import {ServiceContext} from '../../system/service/ServiceContext.js'
import {ServiceBase} from '../../system/service/ServiceBase.js'
import {HttpServerDriver} from '../../drivers/HttpServerDriver/HttpServerDriver.js'
import {DRIVER_NAMES} from '../../types/contstants.js'

export const UiHttpServiceIndex: ServiceIndex = (ctx: ServiceContext): ServiceBase => {
  return new UiHttpService(ctx)
}


export class UiHttpService extends ServiceBase {
  private httpServer!: HttpServerDriver
  // TODO: add require driver

  async init(onFall: (err: SubprogramError) => void, cfg?: Record<string, any>) {
    super.init(onFall)

    // TODO: это должен быть инстанс сервера
    this.httpServerDriver = this.ctx.drivers.getDriver(DRIVER_NAMES.HttpServerDriver)
  }

  async destroy() {
    // TODO: stop server
    // TODO: remove instance
  }

  async start() {
    //this.httpServerDriver
    // TODO: start server
  }

  async stop(force?: boolean) {
    // TODO: stop server
  }

}
