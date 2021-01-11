import EntityBase from '../../base/EntityBase'
import WsServerIo, {
  WS_SERVER_CONNECTION_TIMEOUT_SEC,
  WsCloseStatus, WsServerConnectionParams,
  WsServerEvent,
  WsServerProps,
} from '../../interfaces/io/WsServerIo'
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

    await this.waitForServerStarted()

    this.wsServerIo.on(WsServerEvent.serverClosed, (serverId: string) => {
      if (serverId !== this.serverId) return
      // TODO: запустить дестрой инстанса????
    })

    this.wsServerIo.on(WsServerEvent.newConnection, (
      connectionId: string,
      params: WsServerConnectionParams,
      serverId: string
    ) => {
      if (serverId !== this.serverId) return

      this.events.emit(WS_SERVER_DRIVER_EVENTS.newConnection, serverId)
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


  async sendMessage(connectionId: string, data: string | Uint8Array) {
    await this.wsServerIo.sendMessage(connectionId, data)
  }

  async closeConnection(
    connectionId: string,
    code: WsCloseStatus,
    reason: string
  ): Promise<void> {
    await this.wsServerIo.closeConnection(connectionId, code, reason)
  }


  private waitForServerStarted(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      (async () => {
        let wasInited = false

        const serverCloseHandlerIndex = await this.wsServerIo.on(
          WsServerEvent.serverClosed,
          (serverId: string) => {
            if (serverId !== this.serverId) return

            clearTimeout(timeout)
            this.wsServerIo.off(serverCloseHandlerIndex)
              .catch(this.log.error)
            this.wsServerIo.off(serverStartedHandlerIndex)
              .catch(this.log.error)

            if (!wasInited) {
              reject(
                `Server "${this.serverId}" has been closed at start up time.`
              )
            }
          }
        )

        const serverStartedHandlerIndex = await this.wsServerIo.on(
          WsServerEvent.serverStarted,
          (serverId: string) => {
            if (serverId !== this.serverId) return

            wasInited = true

            clearTimeout(timeout)
            this.wsServerIo.off(serverCloseHandlerIndex)
              .catch(this.log.error)
            this.wsServerIo.off(serverStartedHandlerIndex)
              .catch(this.log.error)
            resolve()
          }
        )

        const timeout = setTimeout(() => {
          reject(
            `Timeout has been exceeded starting server "${this.serverId}"`
          )

          this.wsServerIo.off(serverCloseHandlerIndex)
            .catch(this.log.error)
          this.wsServerIo.off(serverStartedHandlerIndex)
            .catch(this.log.error)
        }, WS_SERVER_CONNECTION_TIMEOUT_SEC)
      })()
    })
  }
}

export class WsServerDriver extends DriverFactoryBase {
  protected SubDriverClass = WsServerInstance
  protected instanceId = (props: WsServerDriverProps): string => {
    return `${props.host}:${props.port}`
  }
}
