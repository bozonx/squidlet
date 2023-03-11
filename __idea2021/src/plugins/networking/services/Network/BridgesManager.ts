import IndexedEventEmitter from 'squidlet-lib/src/IndexedEventEmitter'

type BridgesManagerHandler = (
  connectionId: string,
  channel: number,
  payload: Uint8Array
) => void

export enum BRIDGE_MANAGER_EVENTS {
  incomeMessage,
}


export class BridgesManager {
  private events = new IndexedEventEmitter()


  async init() {

  }

  async destroy() {
    this.events.destroy()
  }


  async send(connectionId: string, channel: number, payload: Uint8Array) {
    // TODO: add
  }

  on(eventName: BRIDGE_MANAGER_EVENTS, cb: BridgesManagerHandler): number {
    return this.events.addListener(BRIDGE_MANAGER_EVENTS.incomeMessage, cb)
  }

  off(handlerIndex: number) {
    this.events.removeListener(handlerIndex)
  }

}
