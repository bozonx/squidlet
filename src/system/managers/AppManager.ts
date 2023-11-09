import type {System} from '../System.js'
import {AppContext} from '../context/AppContext.js'
import type {AppBase} from '../../base/AppBase.js'
import type {AppIndex} from '../../types/types.js'


export class AppManager {
  private readonly system: System
  private apps: Record<string, AppBase> = {}


  constructor(system: System) {
    this.system = system
  }


  async init() {
    for (const appName of Object.keys(this.apps)) {
      const app = this.apps[appName]

      if (app.requireDriver) {
        const found: string[] = this.system.drivers.getNames().filter((el) => {
          if (app.requireDriver?.includes(el)) return true
        })

        if (found.length !== app.requireDriver.length) {
          this.system.log.warn(`Application "${appName}" hasn't meet a dependency drivers "${app.requireDriver.join(', ')}"`)
          await app.destroy?.()
          // do not register the app if ot doesn't meet his dependencies
          delete this.apps[appName]

          continue
        }
      }

      if (app.init) {
        this.system.log.debug(`AppManager: initializing app "${appName}"`)

        try {
          await app.ctx.init()
          await app.init()
        }
        catch (e) {
          this.system.log.error(`AppManager: app's "${appName}" init error: ${e}`)

          return
        }
      }
    }
  }

  async destroy() {
    for (const appName of Object.keys(this.apps)) {
      const app = this.apps[appName]

      if (app.destroy) {
        this.system.log.debug(`AppManager: destroying app "${appName}"`)

        // TODO: добавить таймаут дестроя

        try {
          await app.destroy()
          await app.ctx.destroy()
        }
        catch (e) {
          this.system.log.error(`App "${appName} destroying with error: ${e}"`)
          // then ignore an error
        }
      }
    }
  }


  getApp<T extends AppBase>(appName: string): T | undefined {
    return this.apps[appName] as T
  }

  getAppApi<T = Record<string, any>>(appName: string): T | undefined {
    return this.apps[appName]?.getApi?.()
  }

  getAppNames(): string[] {
    return Object.keys(this.apps)
  }

  useApp(appIndex: AppIndex) {
    const appInstance = appIndex()
    const appName: string = appInstance.myName

    if (this.apps[appName]) {
      throw new Error(`Can't register app "${appName}" because it has already registered`)
    }

    const appController = new AppContext(this.system, appName)

    appInstance.$setCtx(appController)

    this.apps[appName] = appInstance
  }

}
