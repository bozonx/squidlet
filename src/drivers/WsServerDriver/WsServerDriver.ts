import EntityBase from '../../base/EntityBase'
import WsServerIo, {WsCloseStatus, WsServerEvent, WsServerProps} from '../../interfaces/io/WsServerIo'
import IndexedEventEmitter from '../../../../squidlet-lib/src/IndexedEventEmitter'
import DriverFactoryBase from '../../base/DriverFactoryBase'


export enum WS_SERVER_DRIVER_EVENTS {
  newConnection,
  connectionClosed,
  message,
}

interface WsServerDriverProps extends WsServerProps {
}


export class WsServerInstance extends EntityBase<WsServerDriverProps> {
  private events = new IndexedEventEmitter()
  private wsServerIo!: WsServerIo
  private serverId!: string


  async init(): Promise<void> {
    this.wsServerIo = this.context.getIo('WsServer')
    this.serverId = await this.wsServerIo.newServer(this.props)

    this.wsServerIo.on(WsServerEvent.serverStarted, (serverId: string) => {
      if (serverId !== this.serverId) return

      // TODO: resolve INIT promise with timeout
    })

    this.wsServerIo.on(WsServerEvent.serverClosed, (serverId: string) => {
      if (serverId !== this.serverId) return
      // TODO: what to do ????
    })

    this.wsServerIo.on(WsServerEvent.newConnection, (serverId: string) => {
      if (serverId !== this.serverId) return
      // TODO: what to do ????
    })

    this.wsServerIo.on(WsServerEvent.incomeMessage, (
      connectionId: string,
      data: string | Uint8Array,
      serverId: string
    ) => {
      if (serverId !== this.serverId) return

      this.events.emit(WS_SERVER_DRIVER_EVENTS.message, connectionId, data, serverId)
    })

    this.wsServerIo.on(WsServerEvent.connectionClosed, (
      connectionId: string,
      code: WsCloseStatus,
      reason: string,
      serverId: string
    ) => {
      if (serverId !== this.serverId) return

      this.events.emit(
        WS_SERVER_DRIVER_EVENTS.connectionClosed,
        connectionId,
        code,
        reason,
        serverId
      )
    })

    this.wsServerIo.on(WsServerEvent.error, (
      err: string,
      serverId: string,
      connectionId?: string
    ) => {
      if (serverId !== this.serverId) return

      this.log.error(`WsServerInstance: connection "${connectionId}" error: ${err}`)
    })
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
  protected SubDriverClass = WsServerInstance
  protected instanceId = (props: WsServerDriverProps): string => {
    return `${props.host}:${props.port}`
  }
}
