import {System} from '../System.js'
import {AppContext} from './AppContext.js'
import {AppController} from './AppController.js'
import {AppBase} from './AppBase.js'
import {AppIndex} from '../../types/types.js'


export class AppManager {
  private readonly system: System
  // restricted system access for apps
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

  useApp(appIndex: AppIndex) {
    const appController = new AppController(this.ctx)
    const appInstance = appIndex(appController)
    const appName: string = appInstance.myName

    if (this.apps[appName]) {
      throw new Error(`Can't register app "${appName}" because it has already registered`)
    }

    this.apps[appName] = appInstance
  }

}
