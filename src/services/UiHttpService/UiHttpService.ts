import {ServiceIndex, SubprogramError} from '../../types/types.js'
import {ServiceContext} from '../../system/service/ServiceContext.js'
import {ServiceBase} from '../../system/service/ServiceBase.js'
import {HttpServerDriver, HttpServerInstance} from '../../drivers/HttpServerDriver/HttpServerDriver.js'
import {DEFAULT_UI_HTTP_PORT, DRIVER_NAMES, SERVICE_TARGETS} from '../../types/contstants.js'
import {HttpServerProps} from '../../types/io/HttpServerIoType.js'
import {ServiceProps} from '../../types/ServiceProps.js'


export const UiHttpServiceIndex: ServiceIndex = (ctx: ServiceContext): ServiceBase => {
  return new UiHttpService(ctx)
}

export interface UiHttpServiceCfg extends HttpServerProps {
}

export const DEFAULT_UI_HTTP_SERVICE_CFG = {
  host: 'localhost',
  port: DEFAULT_UI_HTTP_PORT,
}


export class UiHttpService extends ServiceBase {
  private httpServer!: HttpServerInstance
  private cfg!: UiHttpServiceCfg


  props: ServiceProps = {
    // TODO: require driver
    required: [SERVICE_TARGETS.systemInitialized],
    restartTries: 0
  }


  async init(onFall: (err: SubprogramError) => void, loadedCfg?: UiHttpServiceCfg) {
    super.init(onFall)

    this.cfg = (loadedCfg) ? loadedCfg : DEFAULT_UI_HTTP_SERVICE_CFG

    // TODO: если конфина нет то по умолчанию

    this.httpServer = await this.ctx.drivers
      .getDriver<HttpServerDriver>(DRIVER_NAMES.HttpServerDriver)
      .subDriver({
        host: this.cfg.host,
        port: this.cfg.port,
      } as HttpServerProps)
  }

  async destroy() {
  }

  async start() {
    await this.httpServer.start()
  }

  async stop(force?: boolean) {
    await this.httpServer.stop(force)
  }

}
