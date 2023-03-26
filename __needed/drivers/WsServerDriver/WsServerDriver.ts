import IndexedEventEmitter from 'squidlet-lib/src/IndexedEventEmitter'
import {lastItem} from 'squidlet-lib/src/arrays'

import WsServerIo, {
  WS_SERVER_CONNECTION_TIMEOUT_SEC,
  WsCloseStatus,
  WsServerEvent,
  WsServerProps,
} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/io/WsServerIo.js'
import DriverFactoryBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverFactoryBase.js'
import DriverInstanceBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverInstanceBase.js'


export enum WS_SERVER_DRIVER_EVENTS {
  newConnection,
  connectionClosed,
  incomeMessage,
}

export interface WsServerDriverProps extends WsServerProps {
}


export class WsServerInstance
  extends DriverInstanceBase<WsServerDriverProps, WsServerDriver>
{
  get serverId(): string {
    return this._serverId
  }

  private get wsServerIo(): WsServerIo {
    return this.params.driver.wsServerIo
  }

  private events = new IndexedEventEmitter()
  private _serverId!: string


  $incomeEvent(eventName: WsServerEvent, ...params: any[]) {
    this.events.emit(eventName, ...params)
  }

  async init(): Promise<void> {
    this._serverId = await this.wsServerIo.newServer(this.props)

    try {
      await this.waitForServerStarted()
    }
    catch (e) {
      await this.destroy()

      throw e
    }
  }

  async $doDestroy(): Promise<void> {
    this.events.destroy()
    await this.wsServerIo.destroyServer(this.serverId)
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
        WsServerEvent.serverClosed,
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
        WsServerEvent.serverStarted,
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


export class WsServerDriver extends DriverFactoryBase<WsServerDriverProps>{
  protected SubDriverClass = WsServerInstance
  protected makeInstanceId = (props: WsServerDriverProps): string => {
    return `${props.host}:${props.port}`
  }

  wsServerIo!: WsServerIo


  async init() {
    this.wsServerIo = this.context.getIo('WsServer')

    await this.wsServerIo.on(
      WsServerEvent.error,
      (err: string, serverId: string, connectionId?: string) => {
        this.log.error(err)
      }
    )

    await this.wsServerIo.on(WsServerEvent.serverStarted,(serverId: string) => {
      this.passEventToInstance(WsServerEvent.serverStarted, serverId)
    })

    await this.wsServerIo.on(WsServerEvent.serverClosed,(serverId: string) => {
      this.passEventToInstance(WsServerEvent.serverClosed, serverId)
    })

    await this.wsServerIo.on(WsServerEvent.newConnection,(...params: any[]) => {
      this.passEventToInstance(WsServerEvent.newConnection, ...params)
    })

    await this.wsServerIo.on(WsServerEvent.incomeMessage,(...params: any[]) => {
      this.passEventToInstance(WsServerEvent.incomeMessage, ...params)
    })

    await this.wsServerIo.on(WsServerEvent.connectionClosed,(...params: any[]) => {
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
