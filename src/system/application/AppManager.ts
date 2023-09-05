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
    for (const appName of Object.keys(this.apps)) {
      const app = this.apps[appName]

      if (app.requireDriver) {
        const found: string[] = this.ctx.drivers.getNames().filter((el) => {
          if (app.requireDriver?.includes(el)) return true
        })

        if (found.length !== app.requireDriver.length) {
          this.ctx.log.warn(`Application "${appName}" hasn't meet a dependency drivers "${app.requireDriver.join(', ')}"`)
          await app.destroy?.()
          // do not register the driver if ot doesn't meet his dependencies
          delete this.apps[appName]

          continue
        }
      }

      if (app.init) {
        this.ctx.log.debug(`AppManager: initializing app "${appName}"`)

        try {
          await app.init()
        }
        catch (e) {
          this.ctx.log.error(`AppManager: app's "${appName}" init error: ${e}`)

          return
        }
      }
    }
  }

  async destroy() {
    for (const appName of Object.keys(this.apps)) {
      const app = this.apps[appName]

      if (app.destroy) {
        this.ctx.log.debug(`AppManager: destroying app "${appName}"`)

        // TODO: добавить таймаут дестроя

        try {
          await app.destroy()
        }
        catch (e) {
          this.ctx.log.error(`App "${appName} destroying with error: ${e}"`)
          // then ignore an error
        }
      }
    }
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
