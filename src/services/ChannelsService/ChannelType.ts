export interface ChannelType {
  init(): Promise<void>
  destroy(): Promise<void>
  makeConnectionId(): string
  registerChannel(connectionId: string, channel: number): ChannelInstanceType
}

export interface ChannelInstanceType {
  send(channel: number, ...p: any[]): Promise<void>
}
