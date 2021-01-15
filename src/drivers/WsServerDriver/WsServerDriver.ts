import IndexedEventEmitter from 'squidlet-lib/src/IndexedEventEmitter'
import {lastItem} from 'squidlet-lib/src/arrays'

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
  serverId!: string

  private events = new IndexedEventEmitter()

  private get wsServerIo(): WsServerIo {
    return this.params.driver.wsServerIo
  }


  $incomeEvent(eventName: WsServerEvent, ...params: any[]) {
    this.events.emit(`${SERVER_EVENT_PREFIX}${eventName}`, ...params)
  }

  async init(): Promise<void> {
    this.serverId = await this.wsServerIo.newServer(this.props)

    await this.waitForServerStarted()

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

export class WsServerDriver
  extends DriverFactoryBase<WsServerDriverProps, WsServerInstance>
{
  protected SubDriverClass = WsServerInstance
  protected makeInstanceId = (props: WsServerDriverProps): string => {
    return `${props.host}:${props.port}`
  }

  wsServerIo!: WsServerIo


  async init() {
    this.wsServerIo = this.context.getIo('WsServer')

    this.wsServerIo.on(
      WsServerEvent.error,
      (err: string, serverId: string, connectionId?: string) => {
        this.log.error(err)
      }
    )

    this.wsServerIo.on(WsServerEvent.serverClosed,(serverId: string) => {
      const instanceId = this.resolveInstanceIdByServerId(serverId)

      if (!instanceId) {
        this.log.error(`Can't find instance of server "${serverId}"`)

        return
      }

      this.destroyInstance(instanceId, true)
    })

    this.wsServerIo.on(WsServerEvent.newConnection,(...params: any[]) => {
      this.passEventToInstance(WsServerEvent.newConnection, ...params)
    })

    this.wsServerIo.on(WsServerEvent.incomeMessage,(...params: any[]) => {
      this.passEventToInstance(WsServerEvent.incomeMessage, ...params)
    })

    this.wsServerIo.on(WsServerEvent.connectionClosed,(...params: any[]) => {
      this.passEventToInstance(WsServerEvent.connectionClosed, ...params)
    })
  }


  private passEventToInstance(eventName: WsServerEvent, ...params: any[]) {
    const serverId = lastItem(params)
    const instanceId = this.resolveInstanceIdByServerId(serverId)

    if (!instanceId) {
      this.log.error(`Can't find instance of server "${serverId}"`)

      return
    }

    this.instances[instanceId].$incomeEvent(eventName, ...params)
  }

  private resolveInstanceIdByServerId(serverId: string): string | undefined {
    for (const instanceId of Object.keys(this.instances)) {
      if (this.instances[instanceId].serverId === serverId) {
        return this.instances[instanceId].instanceId
      }
    }

    return
  }

}
