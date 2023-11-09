import {deepGet, deepSet} from 'squidlet-lib'
import type {ServiceIndex, SubprogramError} from '../../types/types.js'
import type {ServiceContext} from '../../system/context/ServiceContext.js'
import {ServiceBase} from '../../base/ServiceBase.js'
import {SYSTEM_SERVICE_NAMES} from '../../types/contstants.js'
import type {ServiceProps} from '../../types/ServiceProps.js'
import type {NetworkServiceApi} from '../Network/NetworkService.js'


export interface PublicApiServiceApi {
  callMethod(toHostId: string | undefined, pathToMethod: string, ...args: any[]): Promise<any>
  registerNode(nodePath: string, item: Record<string, any> | Function, accessToken?: string): void
}


export const PublicApiServiceIndex: ServiceIndex = (ctx: ServiceContext): ServiceBase => {
  return new PublicApiService(ctx)
}

export interface PublicApiServiceCfg {
}

export const DEFAULT_PUBLIC_API_SERVICE_CFG = {
}
export const PUBLIC_API_CATEGORY = 'PUBLIC_API'

export class PublicApiService extends ServiceBase {
  private cfg!: PublicApiServiceCfg
  private nodes: Record<string, any> = {}


  props: ServiceProps = {
    // TODO: require service network
    //requireDriver: [DRIVER_NAMES.WsServerDriver],
    ...super.props,
  }


  getApi(): PublicApiServiceApi {
    return {
      callMethod: this.callMethod.bind(this),
      registerNode: this.registerNode.bind(this),
    } as PublicApiServiceApi
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


  async callMethod(
    toHostId: string | undefined,
    pathToMethod: string,
    ...args: any[]
  ): Promise<any> {
    // TODO: валидировать - не должно быть ф-и, классов, символов в аргументах в глубине

    if (!toHostId) {
      // TODO: либо хост тот же что и мой
      //  - спросить systemInfoService через контекст

      const node = deepGet(this.nodes, pathToMethod)

      if (node) throw new Error(`Node ${node} doesn't exist.`)
      else if (typeof node !== 'function') throw new Error(`Node ${node} is not function.`)

      const result = await node(...args)

      // TODO: валидировать что в результате не должно быть не нужных типов в глубине

      return result as any
    }
    else {
      // remote call
      const network = this.ctx.getServiceApi<NetworkServiceApi>(SYSTEM_SERVICE_NAMES.Network)

      if (!network) throw new Error(`Can't find NetworkService`)

      const resp = await network.sendRequest({
        toHostId,
        category: PUBLIC_API_CATEGORY,
        payload: {
          method: pathToMethod,
          args,
        },
      })

      if (resp.error) throw resp.error

      return resp.payload as any
    }
  }

  /**
   * Register new node
   * @param nodePath - deep path to node
   * @param item - item which can be functions of objects with functions
   * @param accessToken - put token if you register a node in restricted area
   */
  registerNode(nodePath: string, item: Record<string, any> | Function, accessToken?: string) {
    // TODO: validate items - only objects and function в глубине
    // TODO: нужен токен разрешения чтобы разрешить где можно регистрировать свои ф-и

    const currentNode = deepGet(this.nodes, nodePath)

    if (currentNode) throw new Error(`Node ${nodePath} is exists. Can't replace it.`)

    deepSet(this.nodes, nodePath, item)
  }

}
