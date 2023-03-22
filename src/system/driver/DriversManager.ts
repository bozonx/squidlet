import {System} from '../System.js'
import {Driver} from '../../types/types.js'
import {DriverBase} from './DriverBase.js'


export class DriversManager {
  private readonly system: System
  private drivers: Record<string, DriverBase> = {}


  constructor(system: System) {
    this.system = system
  }

  async init() {
    // TODO: init all the driver
  }

  async destroy() {
    // TODO: destory all the driver
  }


  useDriver(driver: Driver) {
    // TODO: add
  }

}
