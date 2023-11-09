import type {ServiceIndex, SubprogramError} from '../../types/types.js'
import type {ServiceContext} from '../../system/context/ServiceContext.js'
import {ServiceBase} from '../../base/ServiceBase.js'
import {
  DRIVER_NAMES
} from '../../types/contstants.js'
import type {ServiceProps} from '../../types/ServiceProps.js'
import type {WsServerInstance} from '../../drivers/WsServerDriver/WsServerDriver.js'


export const SessionsServiceIndex: ServiceIndex = (ctx: ServiceContext): ServiceBase => {
  return new SessionsService(ctx)
}

export interface SessionsServiceCfg {
}

export const DEFAULT_SESSIONS_SERVICE_CFG = {
  // host: LOCAL_HOST,
  // port: DEFAULT_WS_CTRL_PORT,
}

export class SessionsService extends ServiceBase {
  private wsServer!: WsServerInstance
  private cfg!: SessionsServiceCfg


  props: ServiceProps = {
    requireDriver: [DRIVER_NAMES.WsServerDriver],
    ...super.props,
  }


  async init(onFall: (err: SubprogramError) => void, loadedCfg?: SessionsServiceCfg) {
    super.init(onFall)

    this.cfg = (loadedCfg) ? loadedCfg : DEFAULT_SESSIONS_SERVICE_CFG
  }

  async destroy() {
  }

  async start() {
  }

  async stop(force?: boolean) {
  }

}
