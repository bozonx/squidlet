import {System} from '../System.js'
import {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'


export class VersionsManager {
  private readonly system: System


  private get driver(): FilesDriver {
    return this.system.drivers.getDriver('FilesDriver')
  }

  constructor(system: System) {
    this.system = system
  }


  async init() {

  }


  async incrementFileVersion(pathToFile: string) {

    //const fileVersionsDir =
  }

  async removeFileVersions(pathToFiles: string) {

  }

  async renameVersions(files: [string, string][]) {

  }

}
