import {System} from '../System.js'
import {PackageContext} from './PackageContext.js'


export class PackageManager {
  private readonly system
  readonly ctx


  constructor(system: System) {
    this.system = system
    this.ctx = new PackageContext(this.system)
  }


  async destroy() {
    // TODO: дестроить то на что пакеты навешались дестроить
  }


  async loadInstalled() {
    // TODO: load all the installed packages

  }

}
