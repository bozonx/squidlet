import type {System} from '../System.js'

/*
 Права выдаются:
 files:
   * root - на полный доступ ко всем файлам
   * app - для приложения только своя папка в apps, appData, appShared, cache, log
   * home
   * external
 DB:
   * сервис работает только со своим дб
 IoT io:
   * на доступ к I2C, Bluetooth, Serial и тд
 Внешний интернет:
   * на доступ к 1 домену
   * на доступ ко всем доменам
 Api:
   * доступ к api другого хоста

 Как получать права:
   * сервис при первой установке получает сгенерированный ключ доступа
   * когда он хочет получить доступ к чему-то он передает это ключ доступа
   * к этому ключу доступа соотносятся определённые права, которые проставляет пользователь
   * в headless установке можно подключиться через Devices
     с другого устройства с экраном и разрешить права
 */

export class PermissionsManager {
  private readonly system: System


  constructor(system: System) {
    this.system = system
  }

  async init() {
  }

  async destroy() {
  }

}
