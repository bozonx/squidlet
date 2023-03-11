import {System} from '../System.js'

// TODO: по сути это сервис обрертка над сервисом files

export class CacheManager {
  private readonly system: System


  constructor(system: System) {
    this.system = system
  }

  async init() {
  }

  async destroy() {
  }
}
