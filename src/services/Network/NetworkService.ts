import type {ServiceIndex, SubprogramError} from '../../types/types.js'
import type {ServiceContext} from '../../system/context/ServiceContext.js'
import {ServiceBase} from '../../base/ServiceBase.js'
import {
  DRIVER_NAMES
} from '../../types/contstants.js'
import type {ServiceProps} from '../../types/ServiceProps.js'
import type {WsServerInstance} from '../../drivers/WsServerDriver/WsServerDriver.js'


export const NetworkServiceIndex: ServiceIndex = (ctx: ServiceContext): ServiceBase => {
  return new NetworkService(ctx)
}

export interface NetworkServiceCfg {
}

export const DEFAULT_NETWORK_SERVICE_CFG = {
  // host: LOCAL_HOST,
  // port: DEFAULT_WS_CTRL_PORT,
}

export class NetworkService extends ServiceBase {
  private wsServer!: WsServerInstance
  private cfg!: NetworkServiceCfg


  props: ServiceProps = {
    requireDriver: [DRIVER_NAMES.WsServerDriver],
    ...super.props,
  }


  async init(onFall: (err: SubprogramError) => void, loadedCfg?: NetworkServiceCfg) {
    super.init(onFall)

    this.cfg = (loadedCfg) ? loadedCfg : DEFAULT_NETWORK_SERVICE_CFG
  }

  async destroy() {
  }

  async start() {
  }

  async stop(force?: boolean) {
  }

}
