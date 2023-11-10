import type {ServiceIndex, SubprogramError} from '../../types/types.js'
import type {ServiceContext} from '../../system/context/ServiceContext.js'
import {ServiceBase} from '../../base/ServiceBase.js'
import type {ServiceProps} from '../../types/ServiceProps.js'
import {WsClientChannel} from './WsClientChannel.js'
import {WsServerChannel} from './WsServerChannel.js'
import type {ChannelInstanceType, ChannelType} from './ChannelType.js'


export const ChannelServiceIndex: ServiceIndex = (ctx: ServiceContext): ServiceBase => {
  return new ChannelsService(ctx)
}
export const CHANNEL_ID_DELIMITER = '|'

export interface ChannelServiceConnectionCfg {
  type: keyof typeof CHANNELS_WRAPPERS
  props: Record<string, any>
}

export interface ChannelServiceApi {
}

export interface ChannelsServiceCfg {
  connections: ChannelServiceConnectionCfg[]
}

export const CHANNELS_WRAPPERS = {
  WsClientChannel: typeof WsClientChannel.constructor,
  WsServerChannel: typeof WsServerChannel.constructor,
}

export const DEFAULT_CHANNELS_SERVICE_CFG = {
  connections: []
}


export class ChannelsService extends ServiceBase {
  private connections: Record<string, ChannelType> = {}
  private cfg!: ChannelsServiceCfg


  props: ServiceProps = {
    //requireDriver: [DRIVER_NAMES.WsServerDriver],
    ...super.props,
  }

  getApi(): ChannelServiceApi {
    return {
      registerChannel: this.registerChannel.bind(this),
    }
  }


  async init(onFall: (err: SubprogramError) => void, loadedCfg?: ChannelsServiceCfg) {
    await super.init(onFall)

    this.cfg = (loadedCfg) ? loadedCfg : DEFAULT_CHANNELS_SERVICE_CFG

    for (const item of this.cfg.connections) {
      this.makeConnection(item.type, item.props)
    }

  }

  async destroy() {
    await this.stop()
  }

  async start() {
    for (const id of Object.keys(this.connections)) {
      await this.connections[id].init()
    }
  }

  async stop(force?: boolean) {
    for (const id of Object.keys(this.connections)) {
      await this.connections[id].destroy()
    }
  }


  async newConnection(type: keyof typeof CHANNELS_WRAPPERS, props: Record<string, any>) {
    const id = this.makeConnection(type, props)

    await this.connections[id].init()
  }

  registerChannel(id: string, channel: number, token?: string): ChannelInstanceType {
    const [type, connectionId] = id.split(CHANNEL_ID_DELIMITER)

    // TODO: проверить токен на системные каналы

    return this.connections[id].registerChannel(connectionId, channel)
  }


  private makeConnection(type: keyof typeof CHANNELS_WRAPPERS, props: Record<string, any>): string {
    const instance: ChannelType = new (CHANNELS_WRAPPERS[type] as any)(props)
    const id = type + CHANNEL_ID_DELIMITER + instance.makeConnectionId()

    if (this.connections[id]) {
      throw new Error(`ChannelsService: Can't register the same connection as exists. "${type}": ${JSON.stringify(props)}`)
    }

    // TODO: надо проверить зависимый драйвер

    this.connections[id] = instance

    return id
  }
}
