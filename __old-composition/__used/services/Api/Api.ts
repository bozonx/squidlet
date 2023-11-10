import {splitFirstElement} from 'squidlet-lib/src/strings'
import {RemoteCall} from 'squidlet-lib/src/RemoteCall'
import {JsonTypes} from 'squidlet-lib/src/interfaces/Types'

import EntityBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/EntityBase.js'
import Network from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/services/Network/Network.js'
import {NETWORK_ACTION_SEPARATOR} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/constants.js'


export default class Api extends EntityBase {
  private remoteCall: RemoteCall


  get network(): Network {
    // TODO: add
  }


  async init() {
    this.network.onIncomeRequest(this.handleIncomeRequests)
    this.remoteCall.on(() => {

    })
  }


  request(
    host: string,
    path: string,
    args: (JsonTypes | Uint8Array)[]
  ): Promise<JsonTypes | Uint8Array> {
    const [ serviceName, serviceAction ] = splitFirstElement(path, NETWORK_ACTION_SEPARATOR)

    if (!serviceAction) throw new Error(`No service action in path: "${path}"`)

    return this.remoteCall.request(host, serviceName, serviceAction, args)
    //
    //
    // const payload = this.encodePayload(serviceAction, args)
    //
    // return this.network.request(host, serviceName, payload)
  }

  async on(): Promise<number> {
    // TODO: сделать спец запрос чтобы на той стороне создался обработчик
    //       который будет пересылать запросы сюда
    // TODO: или может события сделать частью network?
    // TODO: или может это отдельный хэлпер класс
  }

  async once(): Promise<number> {
    // TODO: add
  }

  async off() {
    // TODO: add
  }


  private handleIncomeRequests = (serviceName: string, payload: Uint8Array) => {
    const [serviceAction, args] = this.decodePayload(payload)


    // TODO: add
    // TODO: сделать вызов локального api
  }

}
