import {IndexedEvents} from 'squidlet-lib'
import {IoBase} from './IoBase.js'


export abstract class ServerIoBase<ServerItem, Props> extends IoBase {
  protected readonly events = new IndexedEvents()
  // like {'host:port': [server, events, connections[], isListening]}
  protected readonly servers: Record<string, ServerItem> = {}


  destroy = async () => {
    for (const serverId of Object.keys(this.servers)) {
      await this.destroyServer(serverId)
    }

    this.events.destroy()
  }


  /**
   * Listen all the events of all the servers and connections
   */
  async on(cb: (...p: any[]) => void): Promise<number> {
    return this.events.addListener(cb)
  }

  async off(handlerIndex: number) {
    this.events.removeListener(handlerIndex)
  }

  async newServer(props: Props): Promise<string> {
    const serverId: string = this.makeServerId(props)

    if (this.servers[serverId]) {
      throw new Error(`WS server ${serverId} already exists`)
    }

    this.servers[serverId] = this.startServer(serverId, props)

    return serverId
  }

  async closeServer(serverId: string): Promise<void> {
    return this.destroyServer(serverId)
  }


  protected getServerItem(serverId: string): ServerItem {
    if (!this.servers[serverId]) {
      throw new Error(`Server "${serverId}" hasn't been found`)
    }

    return this.servers[serverId]
  }

  protected abstract destroyServer(serverId: string): Promise<void>
  protected abstract makeServerId(props: Props): string
  protected abstract startServer(serverId: string, props: Props): ServerItem
}
