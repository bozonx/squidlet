import type {ServiceIndex, SubprogramError} from '../../types/types.js'
import {ServiceContext} from '../../system/context/ServiceContext.js'
import {ServiceBase} from '../../base/ServiceBase.js'
import type {WsServerProps} from '../../types/io/WsServerIoType.js'
import {DEFAULT_WS_CTRL_PORT, LOCAL_HOST} from '../../types/constants.js'
import type {ServiceProps} from '../../types/ServiceProps.js'


// TODO: выбирает главного в локальной сети и в интернете
// TODO: все сихронизируют базовую инфу между собой в реальном времени
// TODO: когда появляется новый хост то он ищет свои хосты.
//  Рассылает броадкаст в локальной сети
//  устанавливает соединения через другие сети - блютус, I2C, serial, modbus и тд
//  пытается приконектиться через интернет



export interface ClusterServiceRequestData {

}

export const ClusterServiceIndex: ServiceIndex = (ctx: ServiceContext): ServiceBase => {
  return new ClusterService(ctx)
}

export interface ClusterServiceCfg extends WsServerProps {
}

export const DEFAULT_CTRL_SERVICE_CFG = {
  host: LOCAL_HOST,
  port: DEFAULT_WS_CTRL_PORT,
}


export class ClusterService extends ServiceBase {
  private cfg!: ClusterServiceCfg


  props: ServiceProps = {
    //requireDriver: [DRIVER_NAMES.WsServerDriver],
    ...super.props,
  }


  async init(onFall: (err: SubprogramError) => void, loadedCfg?: ClusterServiceCfg) {
    await super.init(onFall)

    this.cfg = (loadedCfg) ? loadedCfg : DEFAULT_CTRL_SERVICE_CFG

  }

  async destroy() {
  }

  async start() {

  }

  async stop(force?: boolean) {
  }

}
