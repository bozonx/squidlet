import type {ServiceIndex, SubprogramError} from '../../types/types.js'
import type {ServiceContext} from '../../system/service/ServiceContext.js'
import {ServiceBase} from '../../base/ServiceBase.js'
import {
  DRIVER_NAMES
} from '../../types/contstants.js'
import type {ServiceProps} from '../../types/ServiceProps.js'
import type {WsServerInstance} from '../../drivers/WsServerDriver/WsServerDriver.js'


export const PublicApiServiceIndex: ServiceIndex = (ctx: ServiceContext): ServiceBase => {
  return new PublicApiService(ctx)
}

export interface PublicApiServiceCfg {
}

export const DEFAULT_PUBLIC_API_SERVICE_CFG = {
  // host: LOCAL_HOST,
  // port: DEFAULT_WS_CTRL_PORT,
}

export class PublicApiService extends ServiceBase {
  private wsServer!: WsServerInstance
  private cfg!: PublicApiServiceCfg


  props: ServiceProps = {
    requireDriver: [DRIVER_NAMES.WsServerDriver],
    ...super.props,
  }


  async init(onFall: (err: SubprogramError) => void, loadedCfg?: PublicApiServiceCfg) {
    super.init(onFall)

    this.cfg = (loadedCfg) ? loadedCfg : DEFAULT_PUBLIC_API_SERVICE_CFG
  }

  async destroy() {
  }

  async start() {
  }

  async stop(force?: boolean) {
  }

}
