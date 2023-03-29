import {System} from '../System.js'


export class RestrictedMemStorage {
  private readonly system: System
  private readonly appName: string


  constructor(system: System, appName: string) {
    this.system = system
    this.appName = appName
  }

  // TODO: ограничить правами только на свой dir

}
