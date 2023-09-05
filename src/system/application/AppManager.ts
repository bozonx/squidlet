import {System} from '../System.js'
import {Application} from './Application.js'


// TODO: как зарегать приложение??? какой-то install script???

export class AppManager {
  private readonly system: System
  private apps: Record<string, Application> = {}


  constructor(system: System) {
    this.system = system
  }


  async init() {

    // TODO: конфиги приожений - поднрузить

  }

  async destroy() {
    // TODO: выполнить destroy всех app
  }


  getApp(appName: string): Application | undefined {
    return this.apps[appName]
  }

  registerApp(appName: string): Application {
    if (this.apps[appName]) {
      throw new Error(`Can't register app "${appName}" because it has already registered`)
    }

    const app = new Application()

    return app
  }

}
