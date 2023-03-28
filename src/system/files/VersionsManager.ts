import {System} from '../System.js'
import {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'


export class VersionsManager {
  private readonly system: System


  private get driver(): FilesDriver {
    return this.system.drivers.getDriver('FilesDriver')
  }

  constructor(system: System) {
    this.system = system

    // TODO: в конфиге можно указать какие директории имеюют сколько версий
    //       тогда нужно каждый раз сравнивать с конфигом чтобы понять сколько версий использовать
  }


  async init() {

  }


  async incrementFileVersion(pathToFile: string) {

    //const fileVersionsDir =
  }

  async removeFileVersions(pathToFile: string) {

  }

  async removeVersionsDirRecursively(pathToDir: string) {

  }

  async renameVersions(files: [string, string][]) {

  }

}
