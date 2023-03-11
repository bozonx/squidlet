import {System} from '../System.js'


export class DriversManager {
  private readonly system: System


  constructor(system: System) {
    this.system = system
  }

  async init() {
    // TODO: загружаем драйвера, которые были ранее установленны
    // TODO: обращаемся в файловую систему
    // TODO: запуск через sandbox
  }

  async destroy() {
  }
}
