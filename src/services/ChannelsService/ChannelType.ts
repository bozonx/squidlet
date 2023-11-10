export interface ChannelType {
  init(): Promise<void>
  destroy(): Promise<void>
  makeConnectionId(): string
  registerChannel(connectionId: string, channel: number): ChannelInstanceType
  // isConnected(): boolean
  // // it will be fulfilled when connection is established
  // // or right now if it is aready established
  // connectionPromise: Promise<void>

  // TOdO: слушать события соединения - поднялось и тд
}

export interface ChannelInstanceType {
  send(channel: number, ...p: any[]): Promise<void>
  isConnected(): boolean
  connectionPromise: Promise<void>
}

// TODO: поддержка статуса соединения - established,connecting(в первый раз)
//  ,retrying,lost(закончились попытки - значит хост не доступен)
// TODO: если соединение полностью разорвано - либо lost либо намерядо то удалять
//  все обработчики из всех каналов
// TODO: в рамках порта создавать пространство куда можно навешивать обработчики
//       либо это сессия в которую сохранят все обработчики. Потом их все удалить
