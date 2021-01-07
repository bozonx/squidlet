import {
  BridgeConnectionState,
  BridgeDriver,
  ConnectionsEvents,
} from '../../interfaces/BridgeDriver'
import EntityBase from '../../../../base/EntityBase'
import IndexedEventEmitter from '../../../../../../squidlet-lib/src/IndexedEventEmitter'
import {WsServerInstance} from '../../../../drivers/WsServerDriver/WsServerDriver'


interface WsServerBridgeProps {

}


export class WsServerBridge extends EntityBase<WsServerBridgeProps> implements BridgeDriver {
  private events = new IndexedEventEmitter()
  private connectionState: BridgeConnectionState = BridgeConnectionState.initial
  private driver!: WsServerInstance


  async init(): Promise<void> {
    this.driver = this.context.getDriver('WsServerDriver')
  }

  async destroy(): Promise<void> {
    this.events.destroy()
  }


  getConnectionState(): BridgeConnectionState {
    return this.connectionState
  }

  sendMessage(channel: number, body: Uint8Array): Promise<void> {
    // TODO: add
  }

  on(eventName: ConnectionsEvents, cb: (...params: any[]) => void): number {
    return this.events.addListener(eventName, cb)
  }

  off(handlerIndex: number): void {
    this.events.removeListener(handlerIndex)
  }

}
