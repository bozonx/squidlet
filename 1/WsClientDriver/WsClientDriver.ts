import IndexedEventEmitter from 'squidlet-lib/src/IndexedEventEmitter'
import {lastItem} from 'squidlet-lib/src/arrays'

import DriverFactoryBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverFactoryBase.js'
import DriverInstanceBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverInstanceBase.js'
import WsClientIo, {WsClientEvent, WsClientProps} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/io/WsClientIo.js'
import {WsCloseStatus} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/io/WsServerIo.js'


// TODO: use config
const WS_CLIENT_CONNECTION_TIMEOUT_SEC = 60

export enum WS_CLIENT_DRIVER_EVENTS {
  incomeMessage,
}

interface WsClientDriverProps extends WsClientProps {
}


export class WsClientInstance
  extends DriverInstanceBase<WsClientDriverProps, WsClientDriver>
{
  get connectionId(): string {
    return this._connectionId
  }

  private get wsClientIo(): WsClientIo {
    return this.params.driver.wsClientIo
  }

  private events = new IndexedEventEmitter()
  private _connectionId!: string


  $incomeEvent(eventName: WsClientEvent, ...params: any[]) {
    this.events.emit(eventName, ...params)
  }

  async init(): Promise<void> {
    this._connectionId = await this.wsClientIo.newConnection(this.props)

    try {
      await this.waitForConnectionOpened()
    }
    catch (e) {
      await this.destroy()

      throw e
    }
  }

  async $doDestroy(): Promise<void> {
    this.events.destroy()
    await this.wsClientIo.closeConnection(
      this.connectionId,
      WsCloseStatus.closeGoingAway,
      `Instance destroy`
    )
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


  private waitForConnectionOpened(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let wasInited = false

      const connectionCloseHandlerIndex = this.events.addListener(
        WsClientEvent.closed,
        () => {
          clearTimeout(timeout)
          this.events.removeListener(connectionCloseHandlerIndex)
          this.events.removeListener(openConnectionHandlerIndex)

          if (!wasInited) {
            reject(
              `Connection "${this.connectionId}" has been closed at start up time.`
            )
          }
        }
      )

      const openConnectionHandlerIndex = this.events.addListener(
        WsClientEvent.opened,
        () => {
          wasInited = true

          clearTimeout(timeout)
          this.events.removeListener(connectionCloseHandlerIndex)
          this.events.removeListener(openConnectionHandlerIndex)
          resolve()
        }
      )

      const timeout = setTimeout(() => {
        this.events.removeListener(connectionCloseHandlerIndex)
        this.events.removeListener(openConnectionHandlerIndex)
        reject(
          `Timeout has been exceeded opening a connection "${this.connectionId}"`
        )
      }, WS_CLIENT_CONNECTION_TIMEOUT_SEC)
    })
  }
}


export class WsClientDriver
  extends DriverFactoryBase<WsClientDriverProps>
{
  protected SubDriverClass = WsClientInstance
  protected makeInstanceId = (props: WsClientDriverProps): string => props.url

  wsClientIo!: WsClientIo


  async init() {
    this.wsClientIo = this.context.getIo('WsClient')

    await this.wsClientIo.on(
      WsClientEvent.error,
      (connectionId: string, err: string) => {
        this.log.error(err)
      }
    )

    await this.wsClientIo.on(WsClientEvent.opened,(connectionId: string) => {
      this.passEventToInstance(WsClientEvent.opened, connectionId)
    })

    await this.wsClientIo.on(WsClientEvent.closed,(connectionId: string) => {
      this.passEventToInstance(WsClientEvent.closed, connectionId)
    })

    await this.wsClientIo.on(WsClientEvent.incomeMessage,(...params: any[]) => {
      this.passEventToInstance(WsClientEvent.incomeMessage, ...params)
    })

  }


  private passEventToInstance(eventName: WsClientEvent, ...params: any[]) {
    const connectionId = lastItem(params)
    const instanceId = this.resolveInstanceIdByConnectionId(connectionId)

    if (!instanceId) {
      this.log.error(`Can't find instance of connection "${connectionId}"`)

      return
    }

    this.instances[instanceId].$incomeEvent(eventName, ...params)
  }

  private resolveInstanceIdByConnectionId(connectionId: string): string | undefined {
    for (const instanceId of Object.keys(this.instances)) {
      if (this.instances[instanceId].connectionId === connectionId) {
        return this.instances[instanceId].instanceId
      }
    }

    return
  }

}
