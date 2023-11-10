import type {ChannelInstanceType, ChannelType} from './ChannelType.js'
import type {WebSocketClientProps} from '../../types/io/WsClientIoType.js'


export class WsClientChannel implements ChannelType {
  private props: WebSocketClientProps


  constructor(props: WebSocketClientProps) {
    this.props = props
  }

  async init() {
  }

  async destroy() {

  }

  makeConnectionId(): string {
    return this.props.url
  }

  registerChannel(connectionId: string, channel: number): ChannelInstanceType {
    return {} as any
  }

}
