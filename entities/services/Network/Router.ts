import {NetworkMessage} from './Network';

export default class Router {
  destroy() {
    // TODO: add
  }


  cacheRoute(
    incomeMessageTo: string,
    incomeMessageFrom: string,
    incomeMessageRoute: string[],
  ) {
    // TODO: add
  }

  // hasToBeRouted(message: NetworkMessage): boolean {
  //   // TODO: add
  // }

  sendFurther(message: NetworkMessage) {
    // TODO: если надо переслать уменьшить ttl
    // TODO: add
  }

}
