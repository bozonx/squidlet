import {System} from '../System.js'


export type ApiFunction = (...p: any[]) => Promise<void>


export class ApiManager {
  api: Record<string, any> = {}

  private readonly system: System


  constructor(system: System) {
    this.system = system
  }

  // async init() {
  // }
  //
  // async destroy() {
  // }


  getApi<T = any>(apiName: string): T {
    return this.api[apiName]
  }

  // getAppApi<T = any>(appName: string): T | undefined {
  //   const app = this.system.apps.getApp(appName)
  //
  //   if (!app) return
  //
  //   return app.api as T
  // }

  registerApi(apiName: string, newApiObj: Record<string, ApiFunction>) {
    if (this.api[apiName]) {
      throw new Error(`Api ${apiName} has already registered`)
    }

    this.api[apiName] = newApiObj
  }

}
