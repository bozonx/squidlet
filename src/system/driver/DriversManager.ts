import {System} from '../System.js'
import {DriverIndex} from '../../types/types.js'
import {DriverBase} from './DriverBase.js'
import {DriverContext} from './DriverContext.js'


export class DriversManager {
  private readonly system: System
  private drivers: Record<string, DriverBase> = {}
  private readonly ctx


  constructor(system: System) {
    this.system = system
    this.ctx = new DriverContext(this.system)
  }

  async init() {
    // TODO: init all the driver
  }

  async destroy() {
    // TODO: destory all the driver
  }


  useDriver(driverIndex: DriverIndex) {
    const driver = driverIndex(this.ctx)

    this.drivers[driver.name] = driver
  }

}
