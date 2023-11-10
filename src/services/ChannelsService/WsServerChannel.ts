import type {ChannelType} from './ChannelType.js'
import type {WsServerProps} from '../../types/io/WsServerIoType.js'
import type {ChannelInstanceType} from './ChannelType.js'


export class WsServerChannel implements ChannelType {
  private props: WsServerProps


  constructor(props: WsServerProps) {
    this.props = props
  }


  async init() {

    // this.wsServer = await this.ctx.drivers
    //   .getDriver<WsServerDriver>(DRIVER_NAMES.WsServerDriver)
    //   .subDriver({
    //     host: this.cfg.host,
    //     port: this.cfg.port,
    //   } as WsServerProps)
    //
    // this.wsServer.onConnection(this.handleConnection)
    // this.wsServer.onMessage(this.handleMessage)
  }

  async destroy() {
    //await this.wsServer.closeServer(force)
  }

  makeConnectionId(): string {
    return `${this.props.host}:${this.props.port}`
  }


  async send(channel: number) {

  }

  registerChannel(connectionId: string, channel: number): ChannelInstanceType {
    return {} as any
  }

}
