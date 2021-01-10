import EntityBase from '../../base/EntityBase'
import WsServerIo from '../../interfaces/io/WsServerIo'
import IndexedEventEmitter from '../../../../squidlet-lib/src/IndexedEventEmitter'
import DriverFactoryBase from '../../base/DriverFactoryBase'


export enum WS_SERVER_DRIVER_EVENTS {
  newConnection,
  connectionClosed,
  message,
}


export class WsServerInstance extends EntityBase {
  private events = new IndexedEventEmitter()
  private wsServerIo: WsServerIo


  async init(): Promise<void> {
    this.wsServerIo = this.context.getIo('WsServer')
  }

  async destroy(): Promise<void> {
    // TODO: дестроить только есть больше никто не использует
  }

  on(eventName: WS_SERVER_DRIVER_EVENTS, cb: (...params: any[]) => void): number {
    return this.events.addListener(eventName, cb)
  }

  off(handlerIndex: number): void {
    this.events.removeListener(handlerIndex)
  }


  $incomeEvent(eventName: WS_SERVER_DRIVER_EVENTS, ...params: any[]) {
    this.events.emit(eventName, ...params)
  }

  async sendMessage(connectionId: string, data: string | Uint8Array) {
    await this.wsServerIo.sendMessage(connectionId, data)
  }

}

export class WsServerDriver extends DriverFactoryBase {

}
