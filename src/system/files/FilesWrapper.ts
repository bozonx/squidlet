import {System} from '../System.js'
import {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'
import {pathJoin} from '../../../../../../../../mnt/disk2/workspace/squidlet-lib/lib/index.js'


export class FilesWrapper {
  // it is relative path of system root dir
  readonly rootDir: string

  private readonly system: System

  private get driver(): FilesDriver {
    return this.system.drivers.getDriver('FilesDriver')
  }


  constructor(system: System, rootDir: string) {
    this.system = system
    this.rootDir = rootDir.replace(/^[.\\~\/]+/, '')
  }


  async appendFile(pathTo: string, data: string | Uint8Array) {
    return this.driver.appendFile(pathJoin(this.rootDir, pathTo), data)
  }

}
