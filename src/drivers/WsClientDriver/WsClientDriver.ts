import IndexedEventEmitter from 'squidlet-lib/src/IndexedEventEmitter'
import {lastItem} from 'squidlet-lib/src/arrays'

import DriverFactoryBase from '../../base/DriverFactoryBase'
import DriverInstanceBase from '../../base/DriverInstanceBase'
import WsClientIo, {WsClientEvent, WsClientProps} from '../../interfaces/io/WsClientIo'
import {WsCloseStatus} from '../../interfaces/io/WsServerIo'


export enum WS_CLIENT_DRIVER_EVENTS {
  // newConnection,
  // connectionClosed,
  // incomeMessage,
}

interface WsClientDriverProps extends WsClientProps {
}


export class WsClientInstance
  extends DriverInstanceBase<WsClientDriverProps, WsClientDriver>
{
  // TODO: review
  get serverId(): string {
    return this._serverId
  }

  private get wsClientIo(): WsClientIo {
    return this.params.driver.wsClientIo
  }

  private events = new IndexedEventEmitter()
  // TODO: review
  private _serverId!: string


  $incomeEvent(eventName: WsClientEvent, ...params: any[]) {
    this.events.emit(eventName, ...params)
  }

  async init(): Promise<void> {
    // TODO: review
    this._serverId = await this.wsClientIo.newServer(this.props)

    // TODO: review
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
  }

  on(eventName: WS_CLIENT_DRIVER_EVENTS, cb: (...params: any[]) => void): number {
    return this.events.addListener(eventName, cb)
  }

  off(handlerIndex: number): void {
    this.events.removeListener(handlerIndex)
  }


  async sendMessage(connectionId: string, data: string | Uint8Array) {
    await this.wsClientIo.sendMessage(connectionId, data)
  }

  async closeConnection(
    connectionId: string,
    code: WsCloseStatus,
    reason?: string
  ): Promise<void> {
    await this.wsClientIo.closeConnection(connectionId, code, reason)
  }

  // TODO: review
  private waitForServerStarted(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let wasInited = false

      const serverCloseHandlerIndex = this.events.addListener(
        WsClientEvent.serverClosed,
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
        WsClientEvent.serverStarted,
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


export class WsClientDriver
  extends DriverFactoryBase<WsClientDriverProps>
{
  protected SubDriverClass = WsClientInstance
  protected makeInstanceId = (props: WsClientDriverProps): string => {
    return props.url
  }

  wsClientIo!: WsClientIo


  async init() {
    this.wsClientIo = this.context.getIo('WsClient')

    await this.wsClientIo.on(
      WsClientEvent.error,
      (connectionId: string, err: string) => {
        this.log.error(err)
      }
    )

    await this.wsClientIo.on(WsClientEvent.opened,(serverId: string) => {
      this.passEventToInstance(WsClientEvent.opened, serverId)
    })

    await this.wsClientIo.on(WsClientEvent.closed,(serverId: string) => {
      this.passEventToInstance(WsClientEvent.closed, serverId)
    })

    await this.wsClientIo.on(WsClientEvent.incomeMessage,(...params: any[]) => {
      this.passEventToInstance(WsClientEvent.incomeMessage, ...params)
    })

  }


  // TODO: review
  private passEventToInstance(eventName: WsClientEvent, ...params: any[]) {
    const serverId = lastItem(params)
    const instanceId = this.resolveInstanceIdByServerId(serverId)

    if (!instanceId) {
      this.log.error(`Can't find instance of server "${serverId}"`)

      return
    }

    this.instances[instanceId].$incomeEvent(eventName, ...params)
  }

  // TODO: review
  private resolveInstanceIdByServerId(serverId: string): string | undefined {
    for (const instanceId of Object.keys(this.instances)) {
      if (this.instances[instanceId].serverId === serverId) {
        return this.instances[instanceId].instanceId
      }
    }

    return
  }

}
