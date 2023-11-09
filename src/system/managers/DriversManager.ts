import type {System} from '../System.js'
import type {DriverIndex} from '../../types/types.js'
import type {DriverBase} from '../../base/DriverBase.js'
import {DriverContext} from '../context/DriverContext.js'


export class DriversManager {
  private readonly system: System
  private drivers: Record<string, DriverBase> = {}
  private readonly ctx


  constructor(system: System) {
    this.system = system
    this.ctx = new DriverContext(this.system)
  }

  async init() {
    for (const driverName of Object.keys(this.drivers)) {
      const driver = this.drivers[driverName]

      if (driver.requireIo) {
        const found: string[] = this.ctx.io.getNames().filter((el) => {
          if (driver.requireIo?.includes(el)) return true
        })

        if (found.length !== driver.requireIo.length) {
          this.ctx.log.warn(`Driver "${driverName}" hasn't meet a dependency IO "${driver.requireIo.join(', ')}"`)
          await driver.destroy?.()
          // do not register the driver if ot doesn't meet his dependencies
          delete this.drivers[driverName]

          continue
        }
      }

      const driverCfg: Record<string, any> | undefined = await this.system.configs
        .loadDriverConfig(driverName)

      if (driver.init) {
        this.ctx.log.debug(`DriversManager: initializing driver "${driverName}"`)
        await driver.init(driverCfg)
      }
    }
  }

  async destroy() {
    for (const driverName of Object.keys(this.drivers)) {
      const driver = this.drivers[driverName]

      if (driver.destroy) {
        this.ctx.log.debug(`DriversManager: destroying driver "${driverName}"`)
        await driver.destroy()
      }
    }
  }


  getDriver<T>(driverName: string): T {
    return this.drivers[driverName] as T
  }

  getNames(): string[] {
    return Object.keys(this.drivers)
  }

  useDriver(driverIndex: DriverIndex) {
    const driver = driverIndex(this.ctx)
    const driverName: string = driver.myName || driver.constructor.name

    if (this.drivers[driverName]) {
      throw new Error(`The same driver "${driverName} is already in use"`)
    }

    this.drivers[driverName] = driver
  }

}
