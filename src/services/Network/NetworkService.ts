import {IndexedEvents} from 'squidlet-lib'
import type {ServiceIndex, SubprogramError} from '../../types/types.js'
import type {ServiceContext} from '../../system/context/ServiceContext.js'
import {ServiceBase} from '../../base/ServiceBase.js'
import type {ServiceProps} from '../../types/ServiceProps.js'
import type {
  NetworkIncomeRequest, NetworkIncomeResponse,
  NetworkResponseStatus,
  NetworkSendRequest, NetworkSendResponse,
} from '../../types/Network.js'


export interface NetworkServiceApi {
  sendRequest<T = any>(request: NetworkSendRequest): Promise<NetworkIncomeResponse<T>>
  sendResponse(response: NetworkSendResponse): Promise<NetworkResponseStatus>
  listenRequests(category: string, handler: CategoryHandler, token?: string): void
  removeRequestListener(category: number, token?: string): void
}

export type CategoryHandler = (request: NetworkIncomeRequest) => void

export const NetworkServiceIndex: ServiceIndex = (ctx: ServiceContext): ServiceBase => {
  return new NetworkService(ctx)
}

export interface NetworkServiceCfg {
}

export const DEFAULT_NETWORK_SERVICE_CFG = {
}

export class NetworkService extends ServiceBase {
  private cfg!: NetworkServiceCfg
  private categoriesHandlers: Record<string, CategoryHandler> = {}


  props: ServiceProps = {
    //requireDriver: [DRIVER_NAMES.WsServerDriver],
    ...super.props,
  }

  getApi(): NetworkServiceApi {
    return {
      sendRequest: this.sendRequest.bind(this),
      listenRequests: this.listenRequests.bind(this),
      removeRequestListener: this.removeRequestListener.bind(this),
      sendResponse: this.sendResponse.bind(this),
    }
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


  /**
   * Send message to remote host, wait and receive a response from it
   * request is:
   * * toHostId - remote host id or id of local host
   * * category - unique category name which is use to resolve requests
   * * msg - message object with only allowed types of nodes
   * @param request
   */
  async sendRequest<T = any>(request: NetworkSendRequest): Promise<NetworkIncomeResponse<T>> {
    // TODO: validate message - only supported types
    // TODO: make request id
    // TODO: check if handlerId exists
    // TODO: make network message
    // TODO: serialize
    // TODO: resolve nearest host and connection
    // TODO: send message to selected connection
    // TODO: wait for response
    // TODO: timeout of waiting


    return {
      ...request,
      fromHostId: '',
      requestId: '',
      routeHosts: [],
      code: 0,
      payload: '' as any
    }
  }

  async sendResponse(response: NetworkSendResponse): Promise<NetworkResponseStatus> {
    // TODO: проверить что указан requestId

    return {
      code: 0,
    }
  }

  /**
   * Set handler to handle a request for this handler
   * @param category - name of unique category to handle requests
   * @param handler - handle income request here and call sendResponse(resp) after
   *   processing a request.
   * @param token - access token to ocupate special categories
   */
  listenRequests(category: string, handler: CategoryHandler, token?: string) {
    if (this.categoriesHandlers[category]) {
      throw new Error(`Category "${category}" has already registered. Can't replace it.`)
    }

    // TODO: check token. категория common - общая, любые запрос разрешены

    this.categoriesHandlers[category] = handler
  }

  removeRequestListener(category: number, token?: string) {

    // TODO: check token

    delete this.categoriesHandlers[category]
  }

}
