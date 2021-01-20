import {splitFirstElement} from 'squidlet-lib/src/strings'

import EntityBase from '../../../../base/EntityBase'
import Network from '../Network/Network'
import {JsonTypes} from '../../../../interfaces/Types'
import {ApiRequest} from '../../interfaces/ApiRequest'
import {NETWORK_ACtION_SEPARATOR} from '../../constants'


export default class Api extends EntityBase {


  get network(): Network {

  }


  async init() {
    this.network.onIncomeRequest(this.handleIncomeRequests)
  }


  request(
    host: string,
    action: string,
    args: (JsonTypes | Uint8Array)[]
  ): Promise<JsonTypes | Uint8Array> {
    const [ serviceName, serviceAction ] = splitFirstElement(action, NETWORK_ACtION_SEPARATOR)

    const payload = this.makePayload(serviceAction, args)

    return this.network.request(host, serviceName, payload)
  }

  async on(): Promise<number> {
    // TODO: сделать спец запрос чтобы на той стороне создался обработчик
    //       который будет пересылать запросы сюда
    // TODO: или может события сделать частью network?
  }

  async once(): Promise<number> {

  }

  async off() {

  }


  private handleIncomeRequests = () => {

  }

  private makePayload(serviceAction: string, args: (JsonTypes | Uint8Array)[]) {
    // TODO: преобразовать аргументы в Uint8Arr
  }

}
