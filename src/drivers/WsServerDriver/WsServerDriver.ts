import EntityBase from '../../base/EntityBase'
import WsServerIo from '../../interfaces/io/WsServerIo'
import {ConnectionsEvents} from '../../plugins/networking/interfaces/BridgeDriver'


export enum WS_SERVER_DRIVER_EVENTS {
  newConnection,
  connectionClosed,
  message,
}


export class WsServerInstance extends EntityBase {
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


  async sendMessage(connectionId: string, data: string | Uint8Array) {

  }

}
