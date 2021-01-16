import IndexedEventEmitter from 'squidlet-lib/src/IndexedEventEmitter'
import {addFirstItemUint8Arr, withoutFirstItemUint8Arr} from 'squidlet-lib/src/binaryHelpers'

import Context from '../../../../system/Context'
import {BRIDGE_EVENT, BridgeConnectionState, BridgeDriver} from '../../interfaces/BridgeDriver'
import {
  WS_SERVER_DRIVER_EVENTS,
  WsServerDriverProps,
  WsServerInstance,
} from '../../../../drivers/WsServerDriver/WsServerDriver'
import {WsCloseStatus, WsServerConnectionParams} from '../../../../interfaces/io/WsServerIo'
import DriverFactoryBase from '../../../../base/DriverFactoryBase'
import DriverInstanceBase from '../../../../base/DriverInstanceBase'


interface WsServerBridgeProps extends WsServerDriverProps {
}


export class WsServerBridgeInstance
  extends DriverInstanceBase<WsServerBridgeProps> implements BridgeDriver
{
  private events = new IndexedEventEmitter()
  private connectionState: BridgeConnectionState = BridgeConnectionState.initial
  private currentConnectionId?: string
  //private connectionsWaitForHostData: Record<string, true> = {}
  driver!: WsServerInstance


  async init(): Promise<void> {
    this.driver = await this.context.getSubDriver<WsServerInstance>(
      'WsServerDriver',
      this.props
    )

    this.driver.on(WS_SERVER_DRIVER_EVENTS.newConnection, this.handleNewConnection)
    this.driver.on(
      WS_SERVER_DRIVER_EVENTS.connectionClosed,
      this.handleConnectionClosed
    )
    this.driver.on(WS_SERVER_DRIVER_EVENTS.incomeMessage, this.handleNewMessage)
  }

  async $doDestroy(): Promise<void> {
    this.events.destroy()
    await this.driver.destroy()
  }

  on(eventName: BRIDGE_EVENT, cb: (...params: any[]) => void): number {
    return this.events.addListener(eventName, cb)
  }

  off(handlerIndex: number): void {
    this.events.removeListener(handlerIndex)
  }


  getConnectionState(): BridgeConnectionState {
    return this.connectionState
  }

  async sendMessage(channel: number, body: Uint8Array): Promise<void> {
    if (!this.currentConnectionId) throw new Error(`Connection is inactive`)

    await this.driver.sendMessage(
      this.currentConnectionId,
      addFirstItemUint8Arr(body, channel)
    )
  }

  private handleNewConnection = (connectionId: string, params: WsServerConnectionParams) => {

    // if (params.headers.cookie) {
    //   // TODO: проверить сессию - если совпадает то это просто переподключение
    // }
    //
    // // TODO: add timeout
    //
    // // marks that this connection is waited for the host data
    // this.connectionsWaitForHostData[connectionId] = true
  }

  private handleConnectionClosed = (connectionId: string, code: WsCloseStatus) => {

    // TODO: поидее нужно закрывать инстанс

    if (this.authorizedConnectionId !== connectionId) return

    delete this.authorizedConnectionId

    if (code === WsCloseStatus.closeNormal) {
      this.connectionState = BridgeConnectionState.closed
    }
    else {
      // unexpected close
      this.connectionState = BridgeConnectionState.connected
    }

    this.events.emit(ConnectionsEvents.connectionStateChanged, this.connectionState)
  }

  private handleNewMessage = (connectionId: string, data: string | Uint8Array) => {
    if (this.connectionsWaitForHostData[connectionId]) {
      delete this.connectionsWaitForHostData[connectionId]

      if (typeof data !== 'string') {
        this.log.error(`WsServerBridge: Unsupported host data`)

        return
      }

      const hostData: BridgeHostData = JSON.parse(data)

      // TODO: валидировать данные

      // TODO: отправить кукис с сессией back

    }
    else if (this.authorizedConnectionId !== connectionId) {
      // don't handle for a not authorized connections
      return
    }
    // connection is authorized
    if (!(data instanceof Uint8Array)) {
      throw new Error(`Data has to be Uint8Array`)
    }
    else if (data.length <= 0) {
      throw new Error(`Data has to contain at least channel number`)
    }

    this.events.emit(
      ConnectionsEvents.incomeMessage,
      data[0],
      withoutFirstItemUint8Arr(data)
    )
  }

}


export class WsServerBridgeDriver extends DriverFactoryBase<WsServerBridgeProps> {
  protected SubDriverClass = WsServerBridgeInstance
  protected makeInstanceId = (props: WsServerBridgeProps): string => {
    return `${props.host}:${props.port}`
  }
}
