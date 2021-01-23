export class UriEvents {
  constructor() {
  }


  emit(
    hostName: string,
    uri: string,
    eventName: string | number,
    ...params: any[]
  ) {
    // TODO: рассылает по удаленным подписчикам
  }

  async on(
    hostName: string,
    uri: string,
    eventName: string | number,
    cb: (...params: any[]) => void
  ): Promise<number> {
    // TODO: подписывается на удаленное событие
    //       * создается свой спец слушаетль
    //       * регистрируется слушатель на удаленном хосте
  }

  async off(
    hostName: string,
    uri: string,
    handlerIndex: number
  ) {

  }

}
