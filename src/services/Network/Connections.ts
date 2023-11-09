

// TODO: подключиться ко всем соединениям
// TODO: слушать приходящие запросы и либо отправлять в роутер, либо если
//       это конечный пункт то в network

import {NetworkService} from './NetworkService.js'


export class Connections {
  private readonly network: NetworkService


  constructor(network: NetworkService) {
    this.network = network
  }

  async destroy() {
  }

  async start() {
    // TODO: слушать все интерфейсы
  }

  async stop(force?: boolean) {
  }

}
