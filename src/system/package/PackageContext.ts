import {IndexedEventEmitter} from 'squidlet-lib'
import {System} from '../System.js'

export class PackageContext {
  private readonly system


  get events(): IndexedEventEmitter {
    return this.system.events
  }


  constructor(system: System) {
    this.system = system
  }

}
