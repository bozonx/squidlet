import IndexedEventEmitter from 'squidlet-lib/src/IndexedEventEmitter'

import WsServerIo, {
  WS_SERVER_CONNECTION_TIMEOUT_SEC,
  WsCloseStatus, WsServerConnectionParams,
  WsServerEvent,
  WsServerProps,
} from '../../interfaces/io/WsServerIo'
import DriverFactoryBase from '../../base/DriverFactoryBase'
import DriverInstanceBase from '../../base/DriverInstanceBase'


const SERVER_EVENT_PREFIX = 's'

export enum WS_SERVER_DRIVER_EVENTS {
  newConnection,
  connectionClosed,
  message,
}

interface WsServerDriverProps extends WsServerProps {
}


export class WsServerInstance
  extends DriverInstanceBase<WsServerDriverProps, WsServerDriver>
{
  private events = new IndexedEventEmitter()

  private get wsServerIo(): WsServerIo {
    return this.params.driver.wsServerIo
  }

  private serverId!: string


  $incomeEvent(eventName: WsServerEvent, ...params: any[]) {
    this.events.emit(`${SERVER_EVENT_PREFIX}${eventName}`, ...params)
  }

  async init(): Promise<void> {
    this.serverId = await this.wsServerIo.newServer(this.props)

    await this.waitForServerStarted()

    // this.events.addListener(
    //   `${SERVER_EVENT_PREFIX}${WsServerEvent.serverClosed}`,
    //   () => {
    //     // TODO: запустить дестрой инстанса????
    //   }
    // )

    this.events.addListener(
      `${SERVER_EVENT_PREFIX}${WsServerEvent.newConnection}`,
      (
        connectionId: string,
        params: WsServerConnectionParams,
        serverId: string
      ) => {
        this.events.emit(
          WS_SERVER_DRIVER_EVENTS.newConnection,
          connectionId,
          params,
          serverId
        )
      }
    )

    this.events.addListener(
      `${SERVER_EVENT_PREFIX}${WsServerEvent.incomeMessage}`,
      (
        connectionId: string,
        data: string | Uint8Array,
        serverId: string
      ) => {
        this.events.emit(
          WS_SERVER_DRIVER_EVENTS.message,
          connectionId,
          data,
          serverId
        )
      }
    )

    this.events.addListener(
      `${SERVER_EVENT_PREFIX}${WsServerEvent.connectionClosed}`,
      (
        connectionId: string,
        code: WsCloseStatus,
        reason: string,
        serverId: string
      ) => {
        this.events.emit(
          WS_SERVER_DRIVER_EVENTS.connectionClosed,
          connectionId,
          code,
          reason,
          serverId
        )
      }
    )

    return this.serverId
  }

  async $doDestroy(): Promise<void> {
    // TODO: дестроить
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
      let wasInited = false

      const serverCloseHandlerIndex = this.events.addListener(
        `${SERVER_EVENT_PREFIX}${WsServerEvent.serverClosed}`,
        () => {
          clearTimeout(timeout)
          this.events.removeListener(serverCloseHandlerIndex)
          this.events.removeListener(serverStartedHandlerIndex)

          if (!wasInited) {
            reject(
              `Server "${this.serverId}" has been closed at start up time.`
            )
          }
        }
      )

      const serverStartedHandlerIndex = this.events.addListener(
        `${SERVER_EVENT_PREFIX}${WsServerEvent.serverStarted}`,
        () => {
          wasInited = true

          clearTimeout(timeout)
          this.events.removeListener(serverCloseHandlerIndex)
          this.events.removeListener(serverStartedHandlerIndex)
          resolve()
        }
      )

      const timeout = setTimeout(() => {
        this.events.removeListener(serverCloseHandlerIndex)
        this.events.removeListener(serverStartedHandlerIndex)
        reject(
          `Timeout has been exceeded starting server "${this.serverId}"`
        )
      }, WS_SERVER_CONNECTION_TIMEOUT_SEC)
    })
  }
}

export class WsServerDriver extends DriverFactoryBase<WsServerDriverProps> {
  protected SubDriverClass = WsServerInstance
  protected makeInstanceId = (props: WsServerDriverProps): string => {
    return `${props.host}:${props.port}`
  }

  wsServerIo!: WsServerIo

  // TODO: при дестрое наверное отписываться от все собитый

  async init() {
    this.wsServerIo = this.context.getIo('WsServer')

    this.wsServerIo.on(
      `${SERVER_EVENT_PREFIX}${WsServerEvent.error}`,
      (
        err: string,
        serverId: string,
        connectionId?: string
      ) => {
        // TODO: может быть лдя серверва не только для соединения
        this.log.error(`WsServerInstance: connection "${connectionId}" error: ${err}`)
      }
    )


    // this.events.addListener(
    //   `${SERVER_EVENT_PREFIX}${WsServerEvent.serverClosed}`,
    //   () => {
    //     // TODO: запустить дестрой инстанса????
    //   }
    // )

    this.wsServerIo.on(
      WsServerEvent.newConnection,
      (
        connectionId: string,
        params: WsServerConnectionParams,
        serverId: string
      ) => {
        this.events.emit(
          WS_SERVER_DRIVER_EVENTS.newConnection,
          connectionId,
          params,
          serverId
        )
      }
    )

    this.wsServerIo.on(
      WsServerEvent.incomeMessage,
      (
        connectionId: string,
        data: string | Uint8Array,
        serverId: string
      ) => {
        this.events.emit(
          WS_SERVER_DRIVER_EVENTS.message,
          connectionId,
          data,
          serverId
        )
      }
    )

    this.wsServerIo.on(
      WsServerEvent.connectionClosed,
      (
        connectionId: string,
        code: WsCloseStatus,
        reason: string,
        serverId: string
      ) => {
        this.events.emit(
          WS_SERVER_DRIVER_EVENTS.connectionClosed,
          connectionId,
          code,
          reason,
          serverId
        )
      }
    )

  }

}
