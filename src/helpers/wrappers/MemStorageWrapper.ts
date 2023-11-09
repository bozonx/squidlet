import type {System} from '../../system/System.js'

/**
 * Your private space in mem storage
 */

export class MemStorageWrapper {
  private readonly system: System
  private readonly appName: string


  constructor(system: System, appName: string) {
    this.system = system
    this.appName = appName
  }

  // TODO: ограничить правами только на свой dir

}
