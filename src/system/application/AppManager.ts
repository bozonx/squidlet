import {System} from '../System.js'
import {AppContext} from './AppContext.js'
import {AppBase} from './AppBase.js'


// TODO: системное приложение может иметь свои файлы, бд и тд


export class AppManager {
  private readonly system: System
  private readonly ctx: AppContext
  private apps: Record<string, AppBase> = {}


  constructor(system: System) {
    this.system = system
    this.ctx = new AppContext(this.system)
  }


  async init() {

    // TODO: конфиги приожений - поднрузить

  }

  async destroy() {
    // TODO: выполнить destroy всех app
  }


  getApp<T extends AppBase>(appName: string): T | undefined {
    return this.apps[appName] as T
  }

  getAppNames(): string[] {
    return Object.keys(this.apps)
  }

  registerApp(appName: string, app: AppBase) {
    if (this.apps[appName]) {
      throw new Error(`Can't register app "${appName}" because it has already registered`)
    }

    this.apps[appName] = app
  }

}
