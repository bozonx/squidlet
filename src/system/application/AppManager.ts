import {System} from '../System.js'
import {AppContext} from './AppContext.js'


// TODO: как зарегать приложение??? какой-то install script???

export class AppManager {
  private readonly system: System
  private apps: Record<string, AppContext> = {}


  constructor(system: System) {
    this.system = system
  }


  async init() {

    // TODO: конфиги приожений - поднрузить

  }

  async destroy() {
    // TODO: выполнить destroy всех app
  }


  getApp(appName: string): AppContext | undefined {
    return this.apps[appName]
  }

  registerApp(appName: string): AppContext {
    if (this.apps[appName]) {
      throw new Error(`Can't register app "${appName}" because it has already registered`)
    }

    const app = new AppContext()

    return app
  }

}
